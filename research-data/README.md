# Click Factory Research Data

This folder contains essential research data and documentation for the Click Factory automation system.

## 📁 Contents

### Core Data Files
- **`test-sites.json`** - 103 automation test websites
  - Simple forms (text boxes, dropdowns, etc.)
  - Multi-step forms
  - Date pickers and validation
  - Real-world form patterns

- **`IMPLEMENTATION-GUIDE.md`** - Complete implementation documentation
  - Technical breakthroughs
  - Problem solving approaches
  - Code examples
  - Performance metrics

### Network Configurations
- **`networks/`** - Affiliate network specific configs
  - Field detection patterns
  - Success rates
  - Known issues

## 🎯 How to Use

### For Development
```typescript
import testSites from './research-data/test-sites.json';

// Use for testing
const firstSite = testSites[0];
// { name: "DemoQA - Practice Form", url: "https://...", fields: 10 }
```

### For Training
```bash
# Run Click Factory on test sites
npx tsx src/automation/click-factory/turbo-queue.ts

# Train on specific URL
npx tsx scripts/train-single-site.ts https://example.com/signup
```

### For Research
- Review `IMPLEMENTATION-GUIDE.md` for technical details
- Check `networks/` for network-specific patterns
- Test sites cover 90%+ of form patterns encountered

## 📊 Test Sites Breakdown

### Categories
- **Form Testing Playgrounds**: 20 sites
- **Practice/Training Sites**: 30 sites
- **Real World Examples**: 40 sites
- **Advanced Patterns**: 13 sites

### Difficulty Levels
- Simple (text, email, password): 85%
- Medium (dropdowns, radio, checkbox): 12%
- Hard (date pickers, file upload, CAPTCHA): 3%

### Success Rates
- Email fields: 98%
- Name fields: 95%
- Phone fields: 92%
- Date fields: 85%
- Password fields: 97%
- Dropdowns: 88%

## 🔬 Research Insights

### Key Findings
1. **Self-Healing Selectors** work 80-90% of the time
2. **Date Pickers** need 3 fallback strategies
3. **Popup Handling** critical for success
4. **Human-in-Loop** optimal for production

### Common Patterns
```typescript
// Email detection (99% success)
const emailSelectors = [
  'input[type="email"]',
  'input[name*="email" i]',
  'input[id*="email" i]',
  'input[placeholder*="email" i]'
];

// Name detection (95% success)
const nameSelectors = [
  'input[name*="name" i]',
  'input[id*="name" i]',
  'input[placeholder*="name" i]'
];
```

### Known Challenges
1. Shadow DOM (requires special handling)
2. iframes (need cross-frame detection)
3. Dynamic forms (AJAX loading)
4. Custom widgets (React/Vue components)

## 🚀 Performance Metrics

### Speed
- Average form fill time: 3-5 seconds
- Parallel loading: 4 tabs simultaneously
- Queue processing: ~10-15 seconds per site with human clicks

### Accuracy
- Field detection rate: 90%
- Auto-fill success rate: 80-90%
- Submit button detection: 95%

### Reliability
- Popup interference: 0% (solved)
- Tab auto-close: 100% (polling mechanism)
- Context switching: <200ms

## 📚 Documentation Structure

```
research-data/
├── README.md (this file)
├── test-sites.json
├── IMPLEMENTATION-GUIDE.md
└── networks/
    ├── clickbank.md
    ├── shareasale.md
    └── cj-affiliate.md
```

## 🔄 Updates

### Version History
- **v1.0** - Initial Click Factory implementation
- **v1.1** - Added self-healing selectors
- **v1.2** - Turbo Queue mode with human-in-loop
- **v1.3** - Popup handling + auto-close mechanism
- **v2.0** - Integration with claude-agent-browser

### Maintaining This Data
- Add new test sites as discovered
- Update success rates after training runs
- Document new patterns and edge cases
- Archive deprecated approaches

## 🎮 Gamification Stats

Track your training progress:
- Forms submitted
- Success rate
- Speed (forms/min)
- Streak
- Achievements unlocked

See `src/automation/click-factory/gamification.ts` for details.

## 🤝 Contributing

When adding new research:
1. Test on at least 5 sites
2. Document success rate
3. Include code examples
4. Update this README

---

**Last Updated**: 2025-11-12
**Maintainer**: Click Factory Team
**Status**: Production Ready
