# Effipay - A Web-Based Payroll Management System

**Effipay** is a Laravel + React (Inertia + Vite) payroll management system. This system was developed **In Partial Fulfillment of the Requirements for the Degree Bachelor of Science in Computer Science.**

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
