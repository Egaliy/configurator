# Инструкция по загрузке на GitHub

## Шаги для загрузки проекта:

1. **Создайте репозиторий на GitHub:**
   - Перейдите на https://github.com/new
   - Назовите репозиторий (например: `configurator` или `website-cost-configurator`)
   - НЕ инициализируйте с README, .gitignore или лицензией (у нас уже есть файлы)
   - Нажмите "Create repository"

2. **Подключите локальный репозиторий к GitHub:**
   ```bash
   git remote add origin https://github.com/ВАШ_USERNAME/НАЗВАНИЕ_РЕПОЗИТОРИЯ.git
   git branch -M main
   git push -u origin main
   ```

3. **Включите GitHub Pages:**
   - Перейдите в Settings → Pages
   - В разделе "Source" выберите "GitHub Actions"
   - После первого пуша workflow автоматически задеплоит сайт

4. **Автоматический деплой:**
   - При каждом пуше в ветку `main` сайт автоматически обновится
   - Сайт будет доступен по адресу: `https://ВАШ_USERNAME.github.io/configurator/`

## Альтернативный вариант (если репозиторий называется по-другому):

Если название репозитория отличается от `configurator`, измените `base` в `vite.config.ts`:
```typescript
base: process.env.NODE_ENV === 'production' ? '/ВАШЕ_НАЗВАНИЕ/' : '/',
```
