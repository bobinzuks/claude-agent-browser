"use strict";
/**
 * DOM Manipulator
 * Handles DOM interactions, element selection, and form manipulation
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMManipulator = void 0;
var DOMManipulator = /** @class */ (function () {
    function DOMManipulator(document) {
        this.document = document;
    }
    /**
     * Find an element using CSS selector
     */
    DOMManipulator.prototype.findElement = function (selector, options) {
        if (options === void 0) { options = {}; }
        // Try regular DOM first
        var element = this.document.querySelector(selector);
        if (element)
            return element;
        // Search in shadow DOM if requested
        if (options.includeShadowDOM) {
            element = this.findInShadowDOM(selector);
            if (element)
                return element;
        }
        // Search in iframes if requested
        if (options.includeIframes) {
            element = this.findInIframes(selector);
            if (element)
                return element;
        }
        return null;
    };
    /**
     * Fill a form field with value
     */
    DOMManipulator.prototype.fillField = function (selector, value) {
        var element = this.findElement(selector);
        if (!element)
            return false;
        if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.value = value;
            // Trigger input and change events for React/Vue compatibility
            this.triggerEvent(element, 'input');
            this.triggerEvent(element, 'change');
            return true;
        }
        return false;
    };
    /**
     * Click an element
     */
    DOMManipulator.prototype.clickElement = function (selector) {
        var element = this.findElement(selector);
        if (!element)
            return false;
        if (element instanceof HTMLElement) {
            element.click();
            return true;
        }
        return false;
    };
    /**
     * Generate smart selector for common field types
     */
    DOMManipulator.prototype.smartSelector = function (fieldType) {
        var selectors = {
            email: 'input[type="email"], input[name*="email" i], input[id*="email" i]',
            password: 'input[type="password"], input[name*="password" i], input[id*="password" i]',
            username: 'input[name*="username" i], input[id*="username" i], input[name*="user" i]',
            submit: 'button[type="submit"], input[type="submit"], button:contains("submit"), button:contains("sign")',
        };
        return selectors[fieldType.toLowerCase()] || "[name*=\"".concat(fieldType, "\" i]");
    };
    /**
     * Wait for an element to appear in the DOM
     */
    DOMManipulator.prototype.waitForElement = function (selector_1) {
        return __awaiter(this, arguments, void 0, function (selector, timeout) {
            var existing;
            var _this = this;
            if (timeout === void 0) { timeout = 5000; }
            return __generator(this, function (_a) {
                existing = this.findElement(selector);
                if (existing)
                    return [2 /*return*/, existing];
                return [2 /*return*/, new Promise(function (resolve) {
                        var observer = new MutationObserver(function () {
                            var element = _this.findElement(selector);
                            if (element) {
                                observer.disconnect();
                                clearTimeout(timeoutId);
                                resolve(element);
                            }
                        });
                        var timeoutId = setTimeout(function () {
                            observer.disconnect();
                            resolve(null);
                        }, timeout);
                        observer.observe(_this.document.body, {
                            childList: true,
                            subtree: true,
                        });
                    })];
            });
        });
    };
    /**
     * Check if page has iframes
     */
    DOMManipulator.prototype.hasIframes = function () {
        return this.document.querySelectorAll('iframe').length > 0;
    };
    /**
     * Find element in Shadow DOM
     */
    DOMManipulator.prototype.findInShadowDOM = function (selector) {
        var allElements = this.document.querySelectorAll('*');
        for (var _i = 0, _a = Array.from(allElements); _i < _a.length; _i++) {
            var element = _a[_i];
            if (element.shadowRoot) {
                var found = element.shadowRoot.querySelector(selector);
                if (found)
                    return found;
            }
        }
        return null;
    };
    /**
     * Find element in iframes
     */
    DOMManipulator.prototype.findInIframes = function (selector) {
        var _a;
        var iframes = this.document.querySelectorAll('iframe');
        for (var _i = 0, _b = Array.from(iframes); _i < _b.length; _i++) {
            var iframe = _b[_i];
            try {
                var iframeDoc = iframe.contentDocument || ((_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.document);
                if (iframeDoc) {
                    var element = iframeDoc.querySelector(selector);
                    if (element)
                        return element;
                }
            }
            catch (e) {
                // Cross-origin iframe, skip
                continue;
            }
        }
        return null;
    };
    /**
     * Trigger an event on an element
     */
    DOMManipulator.prototype.triggerEvent = function (element, eventType) {
        var event = new Event(eventType, {
            bubbles: true,
            cancelable: true,
        });
        element.dispatchEvent(event);
    };
    return DOMManipulator;
}());
exports.DOMManipulator = DOMManipulator;
