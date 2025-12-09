import { ConnectMenu } from './components/connect_menu'

export function Home() {
    return (
        <>
            <div className="step-intro">
                <h2>1. Sign a statement</h2>
                <p>to prove Ownership.</p>
            </div>
            <ConnectMenu />
        </>
    );
}
