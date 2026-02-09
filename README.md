# Website Cost Configurator

A dark-themed web application for calculating website development costs based on project complexity.

**Дизайн-система (для разработчиков и AI):** [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — цвета, типографика, кнопки, формы, отступы, как добавлять новый UI в том же стиле.

## Features

- Two sliders for configuration:
  - Number of Pages (1-20)
  - Animation Complexity (1-10)
- Dynamic calculation of days for each development stage:
  - Research
  - Design Concept
  - Wireframes
  - High-fidelity
  - Dev
  - QA
- Configuration options with discounts:
  - Like That option (minus 1 day on Research)
  - Upload content yourself (minus 1 day on Wireframes)
  - Subscription (minus 10% of total cost)
  - Payment options (upfront discount)
  - Link to us in footer (minus 5%)
- Real-time cost calculation at $1,500 per day

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```
