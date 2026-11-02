
import "../Portfolio.css";

function Portfolio() {
  return (
    <section className="day1-portfolio">
      {/* Banner */}
      <div className="day1-banner">
        <img src="/Image/dea.jpg" alt="Deakin banner" />
        <div className="day1-banner-text">
          Hi, I'm Jasmeet Singh
        </div>
      </div>

      {/* Profile */}
      <img
        className="day1-profile"
        src="/Image/pp.jpg"
        alt="Jasmeet's profile"
      />

      <h3 className="day1-intro">
        I am a full-stack web developer based in Melbourne, Australia.
      </h3>

      <div className="day1-line" />

      {/* Projects */}
      <h2 className="day1-heading">
        Here's what I've done so far
      </h2>

      <div className="day1-project">
        <img src="/Image/calculator.png" alt="Calculator app" />

        <p>
          This is a calculator app created for Android using MAUI.
          <br />
          <a
            href="https://github.com/JasmeetGarha/maui-calculator"
            target="_blank"
            rel="noreferrer"
          >
            GitHub Link
          </a>
        </p>
      </div>

      <div className="day1-project">
        <img
          className="day1-upnxt"
          src="/Image/unnamed.jpg"
          alt="Up Nxt app"
        />

        <p>
          This is a To Do and Task Manager app created for Android using MAUI.
          <br />
          <a
            href="https://play.google.com/store/apps/details?id=com.companyname.upnxt&pcampaignid=web_share"
            target="_blank"
            rel="noreferrer"
          >
            Play Store Link
          </a>
        </p>
      </div>

      <div className="day1-line" />

      {/* Photo gallery */}
      <h2 className="day1-heading">My Photos</h2>

      <div className="day1-photos">
        <img src="/Image/converter.png" alt="Calculator converter" />
        <img src="/Image/scientific.png" alt="Scientific calculator" />
        <img src="/Image/home.jpg" alt="Up Nxt home page" />
        <img src="/Image/list.jpg" alt="Up Nxt task list" />
      </div>
    </section>
  );
}

export default Portfolio;
