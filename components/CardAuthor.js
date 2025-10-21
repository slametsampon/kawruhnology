// components/CardAuthor.js

import Image from './Image';
import { MDXLayoutRenderer } from 'pliny/mdx-components'; // pastikan ini sudah tersedia

const CardAuthor = ({ author }) => {
  const basePath = process.env.BASE_PATH || '';
  const fallbackAvatar = '/static/images/default-avatar.png';
  const avatarSrc = `${basePath}${author.avatar || fallbackAvatar}`;

  console.log('basePath : ', basePath);
  console.log('fallbackAvatar : ', fallbackAvatar);
  console.log('avatarSrc : ', avatarSrc);

  return (
    <div className="mt-5 flex flex-col gap-5 divide-x md:flex-row">
      <div
        className={`${
          author.avatar && 'h-full'
        } min-w-min overflow-hidden rounded-md border-2 border-gray-200 border-opacity-60 dark:border-gray-700`}
      >
        <Image
          alt={author.name}
          src={avatarSrc}
          width={544}
          height={306}
          className="object-cover object-center"
        />
      </div>
      <div>
        <div className="p-6">
          <h2 className="mb-3 text-2xl font-bold leading-8 tracking-tight">
            {author.name}
          </h2>
          <h3 className="mb-3 text-xl font-bold leading-8 tracking-tight">
            {author.occupation}
          </h3>
          <h4 className="mb-3 text-xl font-bold leading-8 tracking-tight">
            {author.company}
          </h4>
          <h4 className="mb-3 text-xl font-bold leading-8 tracking-tight">
            {author.email}
          </h4>
          {/* 🔽 Ganti bio dengan full body markdown */}
          <div className="prose max-w-none dark:prose-invert">
            <MDXLayoutRenderer code={author.body.code} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardAuthor;
