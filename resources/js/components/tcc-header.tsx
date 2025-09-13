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
                <img src="/img/tcc_logo2.jpg" alt="TCC Logo" className="h-15 w-15 object-contain bg-white rounded-full p-1" />
                <div className="flex flex-col">
                    <span className="text-white text-lg font-semibold tracking-wide">Tomas Claudio Colleges</span>
                    <span className="text-white text-xs font-normal tracking-wide opacity-80 mt-0.5">Taghangin, San Juan, Morong, Rizal</span>
                </div>
            </div>
        </header>
    )
}

export default TccHeader