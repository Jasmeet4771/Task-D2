import { Star } from "lucide-react";

function TutorialCard({ tutorial }) {
    return (
        <div className="content-card">

            <img
                src={tutorial.image}
                alt={tutorial.title}
                className="card-image"
            />

            <h3>{tutorial.title}</h3>

            <p className="description">
                {tutorial.description}
            </p>

            <div className="card-footer">
                <span className="rating">
                    <Star size={16} fill="currentColor" />
                    {tutorial.rating}
                </span>

                <span>{tutorial.author}</span>
            </div>

        </div>
    );
}

export default TutorialCard;