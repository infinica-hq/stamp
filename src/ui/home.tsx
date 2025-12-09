import { ConnectMenu } from './components/connect_menu'

export function Home() {
    return (
        <>
            <div className="step-intro">
                <span>
                    <p className="proof-label">Step 1</p>
                    <h2>Stamp your claim</h2>
                </span>
                <p>Create a statement you want to prove as yours.</p>
            </div>
            <ConnectMenu />
        </>
    );
}
