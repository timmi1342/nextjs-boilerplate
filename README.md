# Taklifnoma — static copy

Статическая (offline) копия страницы-приглашения
`https://taklif-link.uz/wedding/bunyod-nazokat`.

Оригинал — SPA на Vite + React: сервер отдаёт пустой `<div id="root">`, вся
разметка собирается в браузере. Здесь сохранён уже отрендеренный DOM плюс
оригинальный CSS-бандл, поэтому страница работает без JS-фреймворка.

## Структура

```
index.html          рендер-DOM + скрипт поведения (~22 KB)
assets/index.css    оригинальный CSS-бандл, 41 @keyframes (~310 KB)
sacred/             декор темы «sacred»: конверт, печать, букеты,
                    лепестки, углы, рваные края бумаги
uploads/            фотографии галереи + фоновая музыка
_source-reference/  original-app-bundle.js — исходный React-бандл сайта,
                    только для справки, страницей не используется
vercel.json         статический деплой, без билда
```

## Анимации

| механика | как включается |
|---|---|
| открытие конверта | `.sgx-cover` → `.is-opening` (scale + fade) → `.is-gone` |
| проявление страницы | `.sgx--revealed .sgx-main { opacity: 1 }` |
| reveal при скролле | `.sgx-reveal` → `.is-visible`, через `IntersectionObserver`, лесенкой по `transition-delay` |
| стрелка «вниз» | `@keyframes sgx-chev` |
| лепестки, дрейф, шиммер | `@keyframes ivx-fall`, `ivx-drift-a/b/c`, `ivx-bob`, `ivx-shimmer`, `ivx-sway-l/r` |
| роза, едущая по таймлайну | CSS-переменные `--sgx-rose-top/-span/-y/-len`, пересчёт на скролле |
| обратный отсчёт | JS, цель `2026-12-20T18:00:00+05:00` |

## Локальный запуск

```bash
python -m http.server 8080
```

## Замечание

Вёрстка, CSS-бандл и графика принадлежат сервису taklif-link.uz;
фотографии и текст — приглашению конкретной пары. Копия сделана для
изучения и не предназначена для выдачи за оригинал.
