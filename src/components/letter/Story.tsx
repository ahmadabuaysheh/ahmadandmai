import { getTranslations } from 'next-intl/server';
import LetterSection from './LetterSection';
import MarginNote from './MarginNote';
import PolaroidFigure from './PolaroidFigure';

interface Chapter {
  title: string;
  body: string;
}

export default async function Story() {
  const t = await getTranslations('story');
  const chapters = t.raw('chapters') as Chapter[];

  return (
    <LetterSection id="story" title={t('title')}>
      <p className="italic text-ink-faded">{t('intro')}</p>
      {chapters.map((chapter, i) => (
        <div key={chapter.title} className="mt-8">
          {i === 1 && <MarginNote>{t('marginNote')}</MarginNote>}
          <h3 className="text-xl">{chapter.title}</h3>
          <p className="mt-2 leading-relaxed">{chapter.body}</p>
          {i < 3 && (
            <PolaroidFigure
              src={`/polaroids/placeholder-${i + 1}.svg`}
              tilt={i % 2 === 0 ? -3 : 4}
            />
          )}
        </div>
      ))}
    </LetterSection>
  );
}
