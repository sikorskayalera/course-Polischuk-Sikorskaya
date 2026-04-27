# NarrativeForge

Веб-платформа для створення та проходження текстових квестів із розгалуженим сюжетом.

## Огляд

NarrativeForge дозволяє авторам будувати інтерактивні розповіді у вигляді орієнтованого графу: кожен **вузол (node)** — це сцена з текстом та необов'язковим зображенням, кожне **ребро (edge)** — вибір, який веде до іншої сцени. Гравці проходять квест у режимі читача, а їхній прогрес зберігається автоматично.

## Стек

| Шар | Технологія |
|-----|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Стилізація | Tailwind CSS |
| Іконки | Lucide React |
| Backend / Auth / DB | Supabase (Edge Functions + PostgreSQL + Row Level Security) |

## Структура проекту

```
src/
  components/
    layout/
      Navbar.tsx          # Глобальна навігація
    ui/
      index.tsx           # Перевикористовувані UI-компоненти (Button, Input, Modal …)
  hooks/
    useStories.ts         # Хук для завантаження списку квестів
  lib/
    api.ts                # REST-клієнт до Supabase Edge Function
    auth.tsx              # AuthContext + useAuth
    supabase.ts           # Ініціалізація supabase-js
    types.ts              # TypeScript-інтерфейси
  pages/
    HomePage.tsx          # Лендінг
    AuthPages.tsx         # Вхід / Реєстрація
    BrowsePage.tsx        # Публічний каталог квестів
    StudioListPage.tsx    # Список квестів автора
    StudioPage.tsx        # Редактор сцен і переходів
    PlayerPage.tsx        # Режим проходження квесту
  App.tsx                 # Hash-роутер
  main.tsx                # Точка входу

supabase/
  functions/api/
    index.ts              # Edge Function: REST API
  migrations/
    ...sql                # DDL-схема бази даних
```

## База даних

Схема складається з 5 таблиць: `users`, `stories`, `nodes`, `edges`, `save_progress`.  
На всіх таблицях увімкнено **Row Level Security**: автор може редагувати лише свої записи, читачі бачать лише публічний контент.

Індекси розставлено на часто фільтрованих полях (`story_id`, `author_id`, `from_node_id`).

## Валідація графу

Кнопка «Перевірити структуру» запускає **DFS-обхід** від стартового вузла:
- фіксує досяжні вузли;
- порівнює з повним списком — ізольовані вузли потрапляють у `isolated_nodes`;
- кінцеві вузли без вихідних ребер вважаються коректними (`is_end_node = true`);
- не-кінцеві вузли без вихідних ребер потрапляють у `dead_ends`.

## Локальний запуск

```bash
# 1. Встановити залежності
npm install

# 2. Скопіювати env-змінні
cp .env.example .env
# Заповнити VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY

# 3. Запустити dev-сервер
npm run dev
```

## Ліцензія

MIT
