"use strict";
/**
 * AgentDB Client - BOSS 4: The Memory Keeper
 * Vector database for storing and retrieving browser automation patterns
 * Uses HNSW (Hierarchical Navigable Small World) for fast similarity search
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentDBClient = void 0;
var hnswlib_node_1 = require("hnswlib-node");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var crypto = __importStar(require("crypto"));
/**
 * AgentDBClient - Vector database for storing browser automation patterns
 */
var AgentDBClient = /** @class */ (function () {
    function AgentDBClient(dbPath, dimensions) {
        if (dimensions === void 0) { dimensions = 384; }
        var _this = this;
        this.dbPath = dbPath;
        this.dimensions = dimensions;
        this.patterns = new Map();
        this.nextId = 0;
        this.embeddingTimes = [];
        this.indexCount = 0;
        // Create database directory
        if (!fs.existsSync(dbPath)) {
            fs.mkdirSync(dbPath, { recursive: true });
        }
        // Initialize or load HNSW index
        var indexPath = path.join(dbPath, 'index.dat');
        var metadataPath = path.join(dbPath, 'metadata.json');
        if (fs.existsSync(indexPath) && fs.existsSync(metadataPath)) {
            // Load metadata first
            var metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            // Restore patterns with their original IDs
            this.patterns = new Map();
            if (metadata.patternsWithIds) {
                metadata.patternsWithIds.forEach(function (_a) {
                    var id = _a[0], pattern = _a[1];
                    _this.patterns.set(id, pattern);
                });
            }
            else {
                // Fallback for old format
                metadata.patterns.forEach(function (p, i) {
                    _this.patterns.set(i, p);
                });
            }
            this.nextId = metadata.nextId;
            this.indexCount = this.patterns.size;
            // Load existing index
            this.index = new hnswlib_node_1.HierarchicalNSW('cosine', dimensions);
            this.index.readIndex(indexPath);
        }
        else {
            // Create new index
            this.index = new hnswlib_node_1.HierarchicalNSW('cosine', dimensions);
            this.index.initIndex(10000); // Max 10k patterns initially
        }
    }
    /**
     * Get dimensions of the vector space
     */
    AgentDBClient.prototype.getDimensions = function () {
        return this.dimensions;
    };
    /**
     * Check if index is initialized
     */
    AgentDBClient.prototype.isInitialized = function () {
        return this.index !== null && this.index !== undefined;
    };
    /**
     * Store an action pattern in the database
     */
    AgentDBClient.prototype.storeAction = function (pattern) {
        var startTime = Date.now();
        // Generate embedding vector from pattern
        var vector = this.generateEmbedding(pattern);
        // Store in HNSW index
        var id = this.nextId++;
        this.index.addPoint(Array.from(vector), id);
        this.indexCount++; // Track count manually
        // Store pattern metadata
        var patternWithTimestamp = __assign(__assign({}, pattern), { timestamp: pattern.timestamp || new Date().toISOString() });
        this.patterns.set(id, patternWithTimestamp);
        // Track embedding time
        var embeddingTime = Date.now() - startTime;
        this.embeddingTimes.push(embeddingTime);
        return id;
    };
    /**
     * Find similar patterns to a query
     */
    AgentDBClient.prototype.findSimilar = function (query, k, options) {
        if (k === void 0) { k = 10; }
        if (options === void 0) { options = {}; }
        if (this.patterns.size === 0) {
            return [];
        }
        var queryVector = this.generateEmbedding(query);
        var searchK = Math.min(k * 2, this.patterns.size, this.indexCount);
        if (searchK === 0) {
            return [];
        }
        var searchResult = this.index.searchKnn(Array.from(queryVector), searchK); // Get extra for filtering
        var results = [];
        for (var i = 0; i < searchResult.neighbors.length; i++) {
            var id = searchResult.neighbors[i];
            var pattern = this.patterns.get(id);
            if (!pattern)
                continue;
            // Apply filters
            if (options.successOnly && pattern.success !== true)
                continue;
            if (options.urlPattern && pattern.url && !pattern.url.includes(options.urlPattern))
                continue;
            // Convert distance to similarity (clamp to [0, 1])
            var similarity = Math.max(0, Math.min(1, 1 - searchResult.distances[i]));
            if (options.minSimilarity && similarity < options.minSimilarity)
                continue;
            results.push({
                pattern: pattern,
                similarity: similarity,
                id: id,
            });
            if (results.length >= k)
                break;
        }
        return results.sort(function (a, b) { return b.similarity - a.similarity; });
    };
    /**
     * Query patterns by metadata
     */
    AgentDBClient.prototype.queryByMetadata = function (metadata) {
        var results = [];
        for (var _i = 0, _a = this.patterns.values(); _i < _a.length; _i++) {
            var pattern = _a[_i];
            if (!pattern.metadata)
                continue;
            var matches = true;
            for (var _b = 0, _c = Object.entries(metadata); _b < _c.length; _b++) {
                var _d = _c[_b], key = _d[0], value = _d[1];
                if (pattern.metadata[key] !== value) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                results.push(pattern);
            }
        }
        return results;
    };
    /**
     * Get top patterns by frequency
     */
    AgentDBClient.prototype.getTopPatterns = function (limit) {
        if (limit === void 0) { limit = 10; }
        var patternCounts = new Map();
        for (var _i = 0, _a = this.patterns.values(); _i < _a.length; _i++) {
            var pattern = _a[_i];
            var key = "".concat(pattern.action, ":").concat(pattern.selector || 'any');
            var existing = patternCounts.get(key) || { count: 0, successes: 0 };
            patternCounts.set(key, {
                count: existing.count + 1,
                successes: existing.successes + (pattern.success ? 1 : 0),
            });
        }
        var summaries = [];
        for (var _b = 0, _c = patternCounts.entries(); _b < _c.length; _b++) {
            var _d = _c[_b], patternKey = _d[0], stats = _d[1];
            summaries.push({
                pattern: patternKey,
                count: stats.count,
                successRate: stats.count > 0 ? stats.successes / stats.count : 0,
            });
        }
        return summaries
            .sort(function (a, b) { return b.count - a.count; })
            .slice(0, limit);
    };
    /**
     * Save index and metadata to disk
     */
    AgentDBClient.prototype.save = function () {
        var indexPath = path.join(this.dbPath, 'index.dat');
        var metadataPath = path.join(this.dbPath, 'metadata.json');
        // Save HNSW index
        this.index.writeIndex(indexPath);
        // Save metadata
        var metadata = {
            version: '1.0.0',
            dimensions: this.dimensions,
            nextId: this.nextId,
            patternsWithIds: Array.from(this.patterns.entries()),
            patterns: Array.from(this.patterns.values()), // Keep for backwards compat
            savedAt: new Date().toISOString(),
        };
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    };
    /**
     * Export training data as JSON
     */
    AgentDBClient.prototype.exportTrainingData = function () {
        var data = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            patterns: Array.from(this.patterns.values()),
            statistics: this.getStatistics(),
        };
        return JSON.stringify(data, null, 2);
    };
    /**
     * Import training data from JSON
     */
    AgentDBClient.prototype.importTrainingData = function (json) {
        try {
            var data = JSON.parse(json);
            if (!data.patterns || !Array.isArray(data.patterns)) {
                throw new Error('Invalid training data format');
            }
            for (var _i = 0, _a = data.patterns; _i < _a.length; _i++) {
                var pattern = _a[_i];
                this.storeAction(pattern);
            }
        }
        catch (error) {
            throw new Error("Failed to import training data: ".concat(error));
        }
    };
    /**
     * Get database statistics
     */
    AgentDBClient.prototype.getStatistics = function () {
        var actionTypes = {};
        var successCount = 0;
        for (var _i = 0, _a = this.patterns.values(); _i < _a.length; _i++) {
            var pattern = _a[_i];
            // Count action types
            actionTypes[pattern.action] = (actionTypes[pattern.action] || 0) + 1;
            // Count successes
            if (pattern.success)
                successCount++;
        }
        var averageEmbeddingTime = this.embeddingTimes.length > 0
            ? this.embeddingTimes.reduce(function (a, b) { return a + b; }, 0) / this.embeddingTimes.length
            : 0;
        return {
            totalActions: this.patterns.size,
            successRate: this.patterns.size > 0 ? successCount / this.patterns.size : 0,
            actionTypes: actionTypes,
            averageEmbeddingTime: averageEmbeddingTime,
        };
    };
    /**
     * Generate embedding vector from action pattern
     * Uses a simple but effective hashing approach for now
     * In production, this would use a proper embedding model
     */
    AgentDBClient.prototype.generateEmbedding = function (pattern) {
        // Create a text representation of the pattern
        var text = [
            pattern.action || '',
            pattern.selector || '',
            pattern.value || '',
            pattern.url || '',
            JSON.stringify(pattern.metadata || {}),
        ].join(' ');
        // Use cryptographic hash for deterministic embeddings
        var hash = crypto.createHash('sha256').update(text).digest();
        // Expand hash to full dimension vector using deterministic random
        var vector = new Float32Array(this.dimensions);
        var seed = hash.readUInt32LE(0);
        // Simple LCG (Linear Congruential Generator) for deterministic random
        var rng = seed;
        for (var i = 0; i < this.dimensions; i++) {
            rng = (rng * 1664525 + 1013904223) >>> 0; // LCG formula
            vector[i] = (rng / 0xFFFFFFFF) * 2 - 1; // Normalize to [-1, 1]
        }
        // Normalize vector
        var magnitude = Math.sqrt(vector.reduce(function (sum, val) { return sum + val * val; }, 0));
        if (magnitude > 0) {
            for (var i = 0; i < this.dimensions; i++) {
                vector[i] /= magnitude;
            }
        }
        return vector;
    };
    return AgentDBClient;
}());
exports.AgentDBClient = AgentDBClient;
