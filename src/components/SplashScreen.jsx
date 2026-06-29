import { APP_LOGO_PATH, APP_NAME, APP_VERSION } from '../config/app'

export default function SplashScreen() {
  return <section className="splash-screen" aria-label="MIRZA splash screen">
    <div className="splash-content">
      <img className="splash-logo" src={APP_LOGO_PATH} alt={APP_NAME} />
      <h1>{APP_NAME}</h1>
      <p>v{APP_VERSION}</p>
    </div>
  </section>
}
