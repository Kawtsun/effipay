import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img src="/img/effipay-logo.svg" alt="Effipay Logo" {...props} />
    );
}
