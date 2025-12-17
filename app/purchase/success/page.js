import Link from "next/link";

export default function Success() {
    return (
        <main className="min-h-screen flex flex-col justify-center items-center p-8 bg-base-100">
            <div className="max-w-md w-full bg-base-200 p-8 rounded-xl shadow-lg text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>

                <div className="space-y-4 text-base-content/80">
                    <p>
                        Thank you for subscribing to KinderCause. Your account is being created right now.
                    </p>

                    <div className="bg-base-100 p-4 rounded-lg my-6 text-left border-l-4 border-primary">
                        <h3 className="font-semibold mb-2">Next Steps:</h3>
                        <ol className="list-decimal list-inside space-y-2">
                            <li>Check your email for a <strong>login link</strong>.</li>
                            <li>Click the link to set your password.</li>
                            <li>Complete your Daycare profile setup.</li>
                        </ol>
                    </div>

                    <p className="text-sm">
                        Didn't receive an email? Check your spam folder or contact support.
                    </p>
                </div>

                <div className="mt-8">
                    <Link href="/signin" className="btn btn-primary w-full">
                        Go to Login
                    </Link>
                </div>
            </div>
        </main>
    );
}
