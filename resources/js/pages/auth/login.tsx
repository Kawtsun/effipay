import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

// import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
// import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import TccHeader from '@/components/tcc-header';

type LoginForm = {
    username: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status}: LoginProps) {
    const { data, setData, post, processing, errors, reset, setError, clearErrors } = useForm<Required<LoginForm>>({
        username: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        // Custom required validation (inline alert instead of toast)
        clearErrors('username', 'password');
        if (!data.username) {
            setError('username', 'Username is required');
            return;
        }
        if (!data.password) {
            setError('password', 'Password is required');
            return;
        }
        post(route('login'), {
            onFinish: () => {
                reset('password');
            },
        });
    };

    return (
        <AuthLayout title="Log in to payroll system" description="Enter admin username and password below to log in">
            <Head title="Log in" />
            <TccHeader />
            <form className="flex flex-col gap-6 w-full" onSubmit={submit} noValidate>
                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="username"
                            autoFocus
                            tabIndex={1}
                            autoComplete="username"
                            value={data.username}
                            onChange={(e) => {
                                setData('username', e.target.value);
                                if (errors.username) clearErrors('username');
                            }}
                            placeholder="Username"
                        />
                        {errors.username && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{errors.username}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            {/* {canResetPassword && (
                                <TextLink href={route('password.request')} className="ml-auto text-sm" tabIndex={5}>
                                    Forgot password?
                                </TextLink>
                            )} */}
                        </div>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                tabIndex={2}
                                autoComplete="current-password"
                                value={data.password}
                                onChange={(e) => {
                                    setData('password', e.target.value);
                                    if (errors.password) clearErrors('password');
                                }}
                                placeholder="Password"
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                title={showPassword ? 'Hide password' : 'Show password'}
                                onClick={() => setShowPassword((v) => !v)}
                                tabIndex={3}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                            </Button>
                        </div>
                        {errors.password && (
                            <Alert variant="destructive" className="mt-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{errors.password}</AlertDescription>
                            </Alert>
                        )}
                    </div>

                    {/* <div className="flex items-center space-x-3">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={data.remember}
                            onClick={() => setData('remember', !data.remember)}
                            tabIndex={3}
                        />
                        <Label htmlFor="remember">Remember me</Label>
                    </div> */}

                    <Button type="submit" className="mt-4 w-full" tabIndex={4} disabled={processing}>
                        {processing && <Spinner className="mr-2" />}
                        Log in
                    </Button>
                </div>

                {/* <div className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <TextLink href={route('register')} tabIndex={5}>
                        Sign up
                    </TextLink>
                </div> */}
            </form>
            {status && <div className="mb-4 text-center text-sm font-medium text-green-600">{status}</div>}
        </AuthLayout>
    );
}
