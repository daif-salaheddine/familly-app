import LoginForm from "../../../components/auth/LoginForm";

export const metadata = {
  title: "Sign in — Family App",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Family App</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>
      </div>
      <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
        <LoginForm />
      </div>
    </div>
  );
}
