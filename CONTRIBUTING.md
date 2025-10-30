# Contributing to BRT

Thank you for considering contributing to the BRT project! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## Getting Started

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/brt.git
   cd brt
   ```

3. Install dependencies:
   ```bash
   # Desktop app
   cd desktop
   npm install

   # Dashboard
   cd ../dashboard
   npm install
   ```

4. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Project Structure

- `desktop/` - Electron desktop application
- `dashboard/` - Next.js web dashboard
- `shared/` - Shared TypeScript types

## Development Workflow

### Desktop Application

1. Start development server:
   ```bash
   cd desktop
   npm run dev
   ```

2. Make your changes
3. Test thoroughly
4. Build to verify:
   ```bash
   npm run build
   ```

### Dashboard

1. Set up environment variables (see dashboard/README.md)
2. Start development server:
   ```bash
   cd dashboard
   npm run dev
   ```

3. Make your changes
4. Test locally
5. Build to verify:
   ```bash
   npm run build
   ```

## Coding Standards

### TypeScript

- Use strict TypeScript (`strict: true`)
- Define interfaces for all data structures
- Avoid `any` type unless absolutely necessary
- Use meaningful variable and function names

### React

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript for prop types

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use trailing commas in multiline objects/arrays
- Run ESLint and Prettier before committing

```bash
# Format code
npm run format

# Lint code
npm run lint
```

## Commit Guidelines

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(desktop): add pause mining button

fix(dashboard): correct leaderboard sorting

docs(readme): update installation instructions

refactor(api): simplify points calculation logic
```

### Commit Best Practices

- Make atomic commits (one logical change per commit)
- Write clear, descriptive commit messages
- Reference issues in commits when applicable
- Keep commits focused and small

## Pull Request Process

### Before Submitting

1. **Test your changes**
   - Desktop: Test on target platforms (Windows/macOS)
   - Dashboard: Test in multiple browsers
   - Verify no console errors or warnings

2. **Update documentation**
   - Update README if adding features
   - Add JSDoc comments to functions
   - Update API documentation if changing endpoints

3. **Check code quality**
   ```bash
   npm run lint
   npm run format
   ```

4. **Verify builds**
   ```bash
   npm run build
   ```

### Submitting Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create pull request on GitHub
3. Fill out the PR template completely
4. Link related issues

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on Windows
- [ ] Tested on macOS
- [ ] Tested in Chrome
- [ ] Tested in Firefox

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
```

## Bug Reports

### Before Submitting

1. Check existing issues
2. Verify bug exists in latest version
3. Gather reproduction steps

### Bug Report Template

```markdown
**Describe the bug**
Clear description of what the bug is

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
- OS: [e.g., Windows 11, macOS 14]
- Desktop App Version: [e.g., 1.0.0]
- Dashboard URL: [e.g., https://...]

**Additional context**
Any other relevant information
```

## Feature Requests

### Before Submitting

1. Check if feature already requested
2. Verify feature aligns with project goals
3. Consider implementation complexity

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Description of the problem

**Describe the solution you'd like**
Clear description of what you want to happen

**Describe alternatives you've considered**
Alternative solutions or features considered

**Additional context**
Any other context or screenshots
```

## Areas for Contribution

### High Priority

- [ ] Test coverage improvements
- [ ] Performance optimizations
- [ ] Error handling enhancements
- [ ] Documentation improvements

### Good First Issues

- UI/UX improvements
- Documentation fixes
- Code formatting
- Adding comments
- Bug fixes (labeled `good-first-issue`)

### Advanced Contributions

- New dashboard features
- Database optimization
- Electron app improvements
- API enhancements

## Questions?

- Check existing documentation
- Review closed issues
- Open a discussion on GitHub
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT for application code, GPLv3 for XMRig components).

## Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to BRT! 🎉
