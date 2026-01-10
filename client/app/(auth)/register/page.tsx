import RegistrationButton from "@/components/registration-button"

export default function RegisterPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Join CryptoDotFun</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Create your account to start exploring the world of crypto games, learning resources, and more.
        </p>
        <div className="pt-4">
          <RegistrationButton size="lg" />
        </div>
      </div>
    </div>
  )
}
