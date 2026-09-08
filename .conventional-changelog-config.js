module.exports = {
  types: [
    { type: 'feat', section: '✨ Features' },
    { type: 'fix', section: '🐛 Bug Fixes' },
    { type: 'perf', section: '⚡ Performance Improvements' },
    { type: 'refactor', section: '♻️ Code Refactoring' },
    { type: 'docs', section: '📝 Documentation' },
    { type: 'style', section: '💎 Styles' },
    { type: 'test', section: '🧪 Tests' },
    { type: 'build', section: '📦 Build System' },
    { type: 'ci', section: '👷 CI/CD' },
    { type: 'security', section: '🔒 Security' },
    { type: 'revert', section: '⏪ Reverts' },
  ],
  header: '## [%VERSION%] - %DATE%(%REPO_URL%/compare/%PREVIOUS_TAG...%TAG%) (%DATE%)',
  mainTemplate: '## [%TITLE%](%REPO_URL%/compare/%PREVIOUS_TAG...%TAG%) (%DATE%)\n\n%BODY%\n',
  issuePrefixes: ['#', '№'],
};
