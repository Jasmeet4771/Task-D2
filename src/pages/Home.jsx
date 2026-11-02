
import ArticleSection from "../components/ArticleSection";
import TutorialSection from "../components/TutorialSection";
import Newsletter from "../components/Newsletter";
import Portfolio from "../components/Portfolio.jsx";
import "../App.css";

function Home() {
  return (
    <>
      <h1>DEV@Deakin</h1>

      <Portfolio />

      <ArticleSection />
      <TutorialSection />
      <Newsletter />
    </>
  );
}

export default Home;
