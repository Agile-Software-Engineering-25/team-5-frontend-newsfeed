import styles from './BasicPostComponent.module.css';

interface BasicPostComponentProps {
  title: string;
  author: string;
  date: string;
  content: string;
}

const BasicPostComponent: React.FC<BasicPostComponentProps> = ({
  title,
  author,
  date,
  content,
}) => {
  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.meta}>
          <span className={styles.author}>Von {author}</span>
          <span className={styles.date}>{date}</span>
        </div>
      </header>
      <p style={{ whiteSpace: "pre-line" }} className={styles.body}> {content} </p>
    </article>
  );
};

export default BasicPostComponent;
