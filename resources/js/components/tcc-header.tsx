function TccHeader() {
    return (
        <header
            className="fixed top-0 left-0 w-full z-40 flex items-center justify-start px-8"
            style={{
                height: '84px',
                background: 'var(--primary)',
            }}
        >
            <div className="flex items-center gap-4">
                <img src="/img/tcc_logo.png" alt="TCC Logo" className="h-12 w-12 object-contain bg-white rounded-full p-1" />
                <span className="text-white text-lg font-semibold tracking-wide">Tomas Claudio Colleges</span>
            </div>
        </header>
    )
}

export default TccHeader