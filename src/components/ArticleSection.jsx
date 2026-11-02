import ArticleCard from "./ArticleCard";
import { articles } from "../data/content";

function ArticleSection() {
    return (
        <section className="content-section">

            <h2>Featured Articles</h2>

            <div className="card-container">
                {articles.map((article) => (
                    <ArticleCard
                        article={article}
                    />
                ))}
            </div>

            <button className="see-all-button">
                See all articles
            </button>

        </section>
    );
}

export default ArticleSection;