import { Star } from "lucide-react";

function ArticleCard({ article }) {
    return (
        <div className="content-card">

            <img
                src={article.image}
                alt={article.title}
                className="card-image"
            />

            <h3>{article.title}</h3>

            <p className="description">
                {article.description}
            </p>

            <div className="card-footer">
                <span className="rating">
                    <Star size={16} fill="currentColor" />
                    {article.rating}
                </span>

                <span>{article.author}</span>
            </div>

        </div>
    );
}

export default ArticleCard;