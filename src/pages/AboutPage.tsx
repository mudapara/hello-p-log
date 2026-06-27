import { FEATURE_AR, FEATURE_PHOTO, FEATURE_MAP, FEATURE_LOG_POST } from '../lib/constants'
import './AboutPage.css'

export function AboutPage() {
  return (
    <article className="about-page">
      <h1>使い方・注意事項</h1>

      <section>
        <h2>このサイトを作った想い</h2>
        <p>
          道を歩いていると、ふと後ろを振り返る人がいる。あれは、自分のおならがバレていないか確かめているのではないか——そんなことをふと思ったのが、きっかけのひとつです。
        </p>
        <p>
          ワカモノリサーチの調査（
          <a
            href="https://wakamono-research.co.jp/media/fart-high-school-students-outside/"
            target="_blank"
            rel="noopener noreferrer"
          >
            高校生の約6割が公共の場でおならをしたことがある
          </a>
          ）を読んで、他人の目をいちばん気にする思春期の高校生でも約60％が経験している。他の世代なら、ほぼ100％に近いんじゃないか。意外と、みんな公共の場でおならをしているんじゃないか——そう感じました。
        </p>
        <p>
          ゲームのログや、残留思念のように、おならの跡がその場所に残ったとしたら、世界は真っ黄色になるんじゃないか。それを、地図の上でちょっとだけ実現してみたいと思い、このサイトを作りました。
        </p>
      </section>

      <section>
        <h2>このサイトについて</h2>
        <p>おならをした場所に、黄色いログを残す——そんなサイトです。</p>
        <ul>
          <li>おならをしてしまった反省のため</li>
          <li>ガスが漂う危険地帯に近づかないよう警告するため</li>
          <li>おならを催してしまう魔境であることを世に広めるため</li>
          <li>その他（気まぐれ、記録好き、など）</li>
        </ul>
        <p>思い思いの目的でご利用くださいませ</p>
      </section>

      <section>
        <h2>使い方</h2>
        <ol>
          <li><strong>{FEATURE_PHOTO.title}</strong> — {FEATURE_PHOTO.desc}位置はブラウザの許可、または写真内の位置情報（EXIF）を使います。</li>
          <li><strong>{FEATURE_AR.title}</strong> — {FEATURE_AR.desc}本格3D ARではなく、カメラ映像の上に重ねる方式です。</li>
          <li><strong>{FEATURE_MAP.title}</strong> — AIとユーザーのログが表示されます。増えるほど地図が黄色く染まります。</li>
          <li><strong>{FEATURE_LOG_POST.title}</strong> — ログだけ、または写真付きで投稿できます。写真付きの場合は合成画像をダウンロードできます。</li>
          <li><strong>ランキング</strong> — 都道府県別とメタンポイント順位</li>
          <li><strong>マイ屁ログ</strong> — Googleログインで、メタンポイント・称号・特別モヤ・自分のログ管理</li>
        </ol>
      </section>

      <section>
        <h2>ご利用にあたって</h2>
        <p>
          おならは生理現象であり、我慢しすぎることは体に良くない場合もあります。
          一方で、本サイトは<strong>野外や公共の場でのおならを推奨・促進するものではありません。</strong>
          マナーを守り、周囲への配慮を忘れないでください。
        </p>
      </section>

      <section>
        <h2>データについて</h2>
        <ul>
          <li>写真やマップに表示されるログには、AIが生成したものも含まれます。ユーザー投稿と区別して表示します。</li>
          <li>位置情報は概算で保存・表示されます。{FEATURE_PHOTO.title}で写真内の位置情報を使う場合は、画面上で選択いただいたうえで、その処理のためだけに読み取ります（サーバーに写真ファイル自体は保存しません）。</li>
          <li>第三者が写る写真は、投稿前にぼかしてください。</li>
        </ul>
      </section>

      <section>
        <h2>Googleログインと個人情報</h2>
        <p>
          Googleアカウントでログインする場合、Google から<strong>メールアドレスとプロフィール情報</strong>を取得します。
          これらはログインの確認、マイ屁ログの表示、ランキング表示のためだけに使用し、広告配信や第三者への販売には利用しません。
        </p>
        <p>
          Googleユーザーデータの取り扱いは、
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>
          に従います。
        </p>
      </section>

      <section>
        <h2>不適切な投稿について</h2>
        <p>
          第三者の肖像、嫌がらせなどが含まれる場合は、
          <a href="/contact">お問い合わせフォーム</a>
          からご連絡ください。内容を確認のうえ、該当ログを削除することがあります。
          個別の返信は行わない場合があります。
        </p>
      </section>
    </article>
  )
}
