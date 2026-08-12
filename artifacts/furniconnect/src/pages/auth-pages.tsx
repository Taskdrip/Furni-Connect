import { SignIn, SignUp } from "@clerk/react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const appearance = {
  variables: { colorPrimary: "#3b2114", colorForeground: "#3b2114", colorMutedForeground: "#74695e", colorBackground: "#fffaf2", colorInput: "#fffaf2", borderRadius: "1rem", fontFamily: "DM Sans, Arial, sans-serif" },
  elements: { card: "shadow-none border border-[#eadfce]", cardBox: "w-full max-w-[440px]", formButtonPrimary: "bg-[#3b2114] hover:bg-[#5a321d]", headerTitle: "font-display", footerActionLink: "text-[#3b2114]" },
};

export function SignInPage() {
  return <div className="flex min-h-screen items-center justify-center bg-[#f4ead8] p-5"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} appearance={appearance} /></div>;
}

export function SignUpPage() {
  return <div className="flex min-h-screen items-center justify-center bg-[#f4ead8] p-5"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} appearance={appearance} /></div>;
}