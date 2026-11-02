import TutorialCard from "./TutorialCard";
import { tutorials } from "../data/content";

function TutorialSection() {
    return (
        <section className="content-section">

            <h2>Featured Tutorials</h2>

            <div className="card-container">
                {tutorials.map((tutorial) => (
                    <TutorialCard
                        tutorial={tutorial}
                    />
                ))}
            </div>

            <button className="see-all-button">
                See all tutorials
            </button>

        </section>
    );
}

export default TutorialSection;