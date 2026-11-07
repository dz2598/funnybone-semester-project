import AuthForm from "@/components/auth-form";
import { FormMessage, type Message } from "@/components/form-message";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function Signin(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  const hasFeedback =
    "message" in searchParams ||
    "error" in searchParams ||
    "success" in searchParams;

  return (
    <div className="flex flex-col w-full max-w-2xl mx-auto pt-16">
      <Card className="w-full border-none shadow-none">
        <CardHeader className="space-y-0">
          <CardTitle className="text-2xl text-center pb-2">
            Continue with your Humor Project account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasFeedback && (
            <div className="flex justify-center">
              <FormMessage message={searchParams} />
            </div>
          )}
          {/* Login Options Group */}
          <div className="space-y-4">
            <AuthForm />

            <p className="text-center text-sm text-muted-foreground">
              Use the same Google account you use on Campus LOL. No second account is created.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
