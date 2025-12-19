export const dynamic = "force-dynamic";

import { createAdminSupabaseClient } from "@/libs/supabase";
import { auth } from "@/libs/auth";
import { redirect } from "next/navigation";
import config from "@/config";

export default async function SettingsPage() {
    const session = await auth();
    if (!session) {
        redirect(config.auth.loginUrl);
    }

    const supabase = createAdminSupabaseClient();
    const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

    const { data: organization } = await supabase
        .from("organizations")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="space-y-8">
                {/* Organization Settings */}
                <div className="bg-base-100 p-8 rounded-xl shadow-sm border border-base-200">
                    <h2 className="text-xl font-bold mb-6">Organization Details</h2>

                    <div className="grid gap-6 max-w-xl">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Organization Name</span>
                            </label>
                            <input
                                type="text"
                                defaultValue={organization?.name}
                                className="input input-bordered w-full bg-base-200"
                                disabled
                            />
                            <div className="label">
                                <span className="label-text-alt text-base-content/60">Contact support to change organization name</span>
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Public URL Slug</span>
                            </label>
                            <div className="join">
                                <span className="btn btn-disabled join-item lowercase font-normal">kindercause.com/</span>
                                <input
                                    type="text"
                                    defaultValue={organization?.slug}
                                    className="input input-bordered join-item w-full bg-base-200"
                                    disabled
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Profile */}
                <div className="bg-base-100 p-8 rounded-xl shadow-sm border border-base-200">
                    <h2 className="text-xl font-bold mb-6">Your Profile</h2>

                    <div className="flex items-center gap-4 mb-6">
                        {session.user.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name}
                                className="w-16 h-16 rounded-full border border-base-300"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                                {session.user.name?.[0] || "U"}
                            </div>
                        )}
                        <div>
                            <p className="font-medium text-lg">{session.user.name}</p>
                            <p className="text-base-content/60">{session.user.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
