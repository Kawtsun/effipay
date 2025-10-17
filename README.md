# Effipay - A Web-Based Payroll Management System

**Effipay** is a Laravel + React (Inertia + Vite) payroll management system. This system was developed **In Partial Fulfillment of the Requirements for the Degree Bachelor of Science in Computer Science.**

## Tech Stack

This project is built with a modern, full-stack technology set:

<p align="left">
  <a href="https://laravel.com/" target="_blank">
    <img src="https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel">
  </a>
  <a href="https://react.dev/" target="_blank">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  </a>
  <a href="https://inertiajs.com/" target="_blank">
    <img src="https://img.shields.io/badge/Inertia.js-9553E9?style=for-the-badge&logo=inertia&logoColor=white" alt="Inertia.js">
  </a>
  <a href="https://vitejs.dev/" target="_blank">
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  </a>
  <a href="https://tailwindcss.com/" target="_blank">
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  </a>
  <a href="https://ui.shadcn.com/" target="_blank">
    <img src="https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" alt="shadcn/ui">
  </a>
</p>

- **[Laravel](https://laravel.com/)**: The PHP framework for our backend logic and structure.
- **[React](https://react.dev/)**: A JavaScript library for building the user interface.
- **[Inertia.js](https://inertiajs.com/)**: The "glue" that connects the Laravel backend to the React frontend without requiring a separate API.
- **[Vite](https://vitejs.dev/)**: Next-generation frontend tooling for a fast development server and optimized production builds.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework for rapidly designing the UI.
- **[shadcn/ui](https://ui.shadcn.com/)**: A collection of re-usable, accessible, and beautifully designed UI components.

## Prerequisites (Windows + XAMPP)

- XAMPP (Apache + MySQL)
- PHP 8.2+ (bundled with XAMPP is fine) and Composer
- Node.js 20+ and npm
- Git

## XAMPP + MySQL quick start

1) Start XAMPP services
- Open XAMPP Control Panel and start Apache and MySQL.

2) Clone the repository

```bash
git clone https://github.com/kawtsun/effipay.git
cd effipay
```

4) Install dependencies

```bash
composer install
npm install
```

5) Copy environment and set app key

```bash
cp .env.example .env
php artisan key:generate
```

6) Configure MySQL in `.env`

Set these values (adjust as needed for your XAMPP setup):

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=effipay
DB_USERNAME=root
DB_PASSWORD=
```

7) Run migrations and seed initial data

```bash
php artisan migrate
php artisan db:seed
```

8) Run the app (backend, queue, and Vite)

One command (recommended):

```bash
composer run dev
```

Or run separately in different terminals:

```bash
php artisan serve
php artisan queue:listen --tries=1
npm run dev
```

Open the app at: http://127.0.0.1:8000

## Build (optional)

Build client assets for production:

```bash
npm run build
```

Advanced (optional): SSR and additional scripts

- SSR dev: `composer run dev:ssr`
- Type check: `npm run types`
- Lint/format: `npm run lint`, `npm run format`
