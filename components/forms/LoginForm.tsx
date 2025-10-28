// Login form component placeholder
export default function LoginForm() {
  return (
    <form>
      <h2>Login</h2>
      <div>
        <label htmlFor="email">Email</label>
        <input type="email" id="email" name="email" />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input type="password" id="password" name="password" />
      </div>
      <button type="submit">Login</button>
    </form>
  )
}