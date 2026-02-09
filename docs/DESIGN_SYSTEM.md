# Дизайн-система конфигуратора

Документ для разработчиков и AI: как оформлять новый UI в этом проекте.

---

## 1. Общая идея

- **Тема:** тёмная, минималистичная.
- **Цвета:** по сути только чёрный фон и белый текст. Акценты — через **прозрачность** (opacity), без дополнительных цветов.
- **Шрифты:** основной текст — Almarena Neue Regular, подзаголовки/мелочь — через opacity. Inter в Tailwind как sans.
- **Стиль:** без лишних подложек, «чуть крупнее чем хочется» + сжатый межбуквенный интервал (tracking-tighter).

---

## 2. Цвета

| Назначение           | Как получить              | Пример класса / значения      |
|----------------------|---------------------------|-------------------------------|
| Фон страницы         | Чёрный                    | `bg-black`                    |
| Текст основной       | Белый                     | `text-white`                  |
| Текст вторичный      | Белый с прозрачностью     | `text-white/60`, `opacity-60` |
| Текст приглушённый   | Белый 50%                 | `text-white/50`, `opacity-50` |
| Обводки / границы    | Белый 10–30%              | `border-white/10`, `border-white/30` |
| Обводка при hover    | Белый ярче                | `border-white/20`, `hover:border-white` |
| Фон блоков (карточки)| Белый 5%                  | `bg-white/5`                 |
| Оверлей модалки      | Чёрный 70%                | `bg-black/70`                 |
| Зачёркнутая цена     | Серый, не красный         | `line-through opacity-50 text-white/50` |

Правило: не вводить новые цвета (красный/синий и т.д.), только белый + opacity.

---

## 3. Типографика

### Шрифты

- **Almarena Neue Regular** — заголовки, крупные подписи, кнопки, цены.  
  Подключение: `index.html` (Google Fonts), в компонентах — класс `heading-large` / `price-large` или inline:
  ```css
  font-family: "Almarena Neue Regular", "Almarena Neue Regular Placeholder", sans-serif;
  font-weight: 400;
  letter-spacing: -0.02em или -0.03em;
  line-height: 1.2em;
  ```
- **Inter** — в Tailwind как `font-sans` (по умолчанию для body в конфиге).

### Размеры (Tailwind)

| Элемент              | Мобилка     | Десктоп (md+)   |
|----------------------|------------|------------------|
| Body                 | 14px       | 16px (в `index.css`) |
| Мелкий текст/подпись | `text-xs`  | `text-sm`        |
| Обычный текст        | `text-sm`  | `text-base`      |
| Подзаголовок         | `text-base`| `text-lg`        |
| Заголовок секции     | `text-2xl` | `text-3xl`       |
| Крупный заголовок    | `text-3xl` | `text-5xl`       |
| Цена крупная         | `text-2xl` | `text-4xl`       |

Везде добавлять **`tracking-tighter`** для текста в интерфейсе.

### Готовые классы (в `src/index.css`)

- **`.heading-large`** — заголовки в стиле Almarena: шрифт, font-weight 400, letter-spacing -0.03em.
- **`.price-large`** — то же для цен (крупные суммы).

Использование:  
`<h1 className="text-3xl md:text-5xl font-normal heading-large">`  
`<div className="text-2xl md:text-4xl font-normal price-large">`

---

## 4. Отступы и сетка

- Вертикальные блоки: `space-y-4`, `space-y-6`, между секциями — `pt-8`, `mb-8`.
- Внутри карточек: `p-4`, `p-6`, `p-8` (на десктопе чаще `md:p-8`).
- Таблица/списки: `py-3 md:py-4`, `px-4 md:px-6`.
- Кнопки: `px-6 py-3` или `px-12 py-4` для главной CTA.

---

## 5. Компоненты

### Кнопки

- **Основная (CTA):** белый фон, чёрный текст.  
  `bg-white text-black rounded-lg hover:opacity-90 transition-opacity tracking-tighter text-base`  
  Шрифт Almarena (через класс или inline style из SubmitButton).
- **Вторичная (outline):** без заливки, обводка.  
  `border border-white/10 rounded-lg hover:border-white transition-colors tracking-tighter text-base`.
- На кнопках **один размер шрифта** — `text-base` (не переключать на text-sm/text-lg для кнопок).

### Поля ввода (форма)

- Фон прозрачный, только обводка:  
  `bg-transparent border border-white/10 rounded-lg`
- Hover: `hover:border-white/20`
- Focus: `focus:outline-none focus:border-white`
- Текст: `text-white`, подпись/placeholder: `text-white/60`, `placeholder:text-white/60`
- Размер: `text-base`, `tracking-tighter`, отступы `px-4 py-3`.

### Чекбоксы и радио

- Кастомные в `index.css`: без стандартного accent, обводка `border-white/30`, при hover `border-white/50`, при checked — белая «галочка»/кружок внутри.  
  Размер контрола: `w-5 h-5`, чекбокс `rounded`, радио `rounded-full`.

### Обводки и карточки

- Тонкая граница: `border border-white/10`.
- Разделители: `border-t border-white/10`, `border-b border-white/10`.
- Скругление: `rounded-lg` для карточек и кнопок.

### Модальное окно (попап)

- Оверлей: `bg-black/70 backdrop-blur-[20px]`, появление/скрытие — transition opacity 300ms.
- При закрытии добавлять `pointer-events-none`, чтобы не перехватывать клики.
- Контент: без своей заливки (`bg-transparent`), только контент внутри.
- Появление: без сдвига, только fade (например, класс `animate-fade-in` из `index.css`).

### Таблицы

- Контейнер: `border border-white/10 rounded-lg overflow-hidden`.
- Строки: `border-b border-white/10`, последняя — `last:border-b-0`.
- Ячейки: `py-3 md:py-4 px-4 md:px-6`, текст `text-sm md:text-base tracking-tighter`.

---

## 6. Адаптивность

- Breakpoint: **768px** (Tailwind `md:`).
- На мобилке: колонки в один столбец (`flex-col`), кнопки на всю ширину при необходимости (`w-full md:w-auto`).
- Там, где в макете есть «мобилка / десктоп» — использовать двойные классы, например `text-sm md:text-base`, `text-2xl md:text-4xl`.

---

## 7. Анимации

- Плавное появление попапа: `animate-fade-in` (0.3s ease-in-out), описание в `index.css` @layer utilities.
- Закрытие: `transition-opacity duration-300` + `opacity-0` + `pointer-events-none`.
- Кнопки/ссылки: `transition-opacity` или `transition-colors` (короткие, без сдвига).

---

## 8. Где что лежит

| Что править           | Файл / место |
|-----------------------|---------------|
| Глобальные стили, body, чекбоксы, утилиты | `src/index.css` |
| Шрифты (подключение)  | `index.html`  |
| Tailwind (sans, letterSpacing) | `tailwind.config.js` |
| Заголовки/цены (классы) | `src/index.css` (секции @layer base) |

---

## 9. Чего избегать

- Ярких акцентных цветов (красный/зелёный для текста и кнопок).
- Крупных фоновых подложек; предпочитать прозрачность и обводки.
- Разных размеров шрифта на кнопках (держать единый `text-base`).
- Зачёркнутой цены красным — только серый/белый с opacity.

При добавлении новых экранов или компонентов: использовать эти токены (цвета через opacity, Almarena для заголовков/цен, те же отступы и радиусы) — тогда следующая нейронка или разработчик сможет опираться на этот документ и держать интерфейс единым.
