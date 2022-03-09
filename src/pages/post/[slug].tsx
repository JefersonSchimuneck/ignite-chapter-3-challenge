import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { ReactElement } from 'react';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): ReactElement {
  const router = useRouter();
  const wordsAmount = post.data.content.reduce((acc, content) => {
    const words = RichText.asText(content.body).split(' ').length;
    return acc + words;
  }, 0);

  return (
    <div className={styles.container}>
      <Header />
      {router.isFallback ? (
        <h1>Carregando...</h1>
      ) : (
        <main>
          <div className={styles.banner}>
            <img src={post.data.banner.url} alt="banner" />
          </div>
          <div className={styles.articleContainer}>
            <h1>{post.data.title}</h1>
            <div className={commonStyles.postInfo}>
              <div className={commonStyles.infoTag}>
                <FiCalendar />
                <time>
                  {format(
                    new Date(post.first_publication_date),
                    'dd MMM yyyy',
                    {
                      locale: ptBR,
                    }
                  )}
                </time>
              </div>
              <div className={commonStyles.infoTag}>
                <FiUser />
                <span>{post.data.author}</span>
              </div>
              <div className={commonStyles.infoTag}>
                <FiClock />
                <span>{`${Math.ceil(wordsAmount / 200)} min`}</span>
              </div>
            </div>
            <article>
              {post.data.content.map(content => (
                <div key={content.heading}>
                  <h2>{content.heading}</h2>
                  <div
                    className={styles.content}
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </div>
              ))}
            </article>
          </div>
        </main>
      )}
    </div>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  return {
    paths: posts.results.map(post => ({
      params: { slug: post.uid },
    })),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const post = await prismic.getByUID('posts', String(slug), {});

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
