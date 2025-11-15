const got = require('@/utils/got');
const cheerio = require('cheerio');
const { parseDate } = require('@/utils/parse-date');

module.exports = async (ctx) => {
    const feedUrl = 'https://www.security-next.com/feed';
    const feed = await got(feedUrl);
    const $feed = cheerio.load(feed.data, { xmlMode: true });

    const items = await Promise.all(
        $feed('item')
            .slice(0, 15)
            .map(async (_, el) => {
                const $item = $feed(el);
                const title = $item.find('title').text();
                const link = $item.find('link').text();
                const pubDate = parseDate($item.find('pubDate').text());

                // 記事HTML取得
                const article = await got(link);
                const $ = cheerio.load(article.data);

                const content = $('div.entry-content').first();

                // ❌関連記事・タグなど不要部分を削除
                content.find('.related, .related-posts, .tag-links, .tags, .share, .breadcrumb').remove();

                return {
                    title,
                    link,
                    pubDate,
                    description: content.html(),
                };
            })
            .get(),
    );

    ctx.state.data = {
        title: 'Security NEXT - Full Content Filtered',
        link: 'https://www.security-next.com/',
        item: items,
    };
};
