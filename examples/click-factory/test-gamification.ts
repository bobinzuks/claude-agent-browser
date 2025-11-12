import { ClickFactoryGamification } from '../../src/automation/click-factory/gamification';

const game = new ClickFactoryGamification();

console.log('🎮 Testing Gamification System\n');

// Simulate 10 successful submissions
for (let i = 0; i < 10; i++) {
    game.recordSubmission(true, 10, 10);
}

const stats = game.getStats();

console.log('📊 Results:');
console.log(`  Level: ${stats.level}`);
console.log(`  XP: ${stats.xp}/${stats.xpToNextLevel}`);
console.log(`  Forms Submitted: ${stats.formsSubmitted}`);
console.log(`  Success Rate: ${stats.successRate.toFixed(1)}%`);
console.log(`  Streak: ${stats.streak}`);
console.log(`  Achievements Unlocked: ${stats.achievements.filter(a => a.unlocked).length}/${stats.achievements.length}`);

console.log('\n🏆 Achievements:');
stats.achievements
    .filter(a => a.unlocked)
    .forEach(a => console.log(`  ${a.icon} ${a.name} (+${a.xp} XP)`));
