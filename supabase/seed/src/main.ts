import { crawlAndSave } from "./stage-1-crawl"
import { enrichLatestData } from "./stage-2-enrich"
import { seedDatabase } from "./stage-3-seed"

const SEED_URLS = [
  "https://newcult.co",
  "https://cult-ui.com",
  "https://cleanmyseo.com",
  "https://github.com/kennetpostigo/react-google-login-component",
  "https://www.curated.design/?category=assets",
  "https://developers.google.com/analytics/devguides/collection/analyticsjs/",
  "https://css-tricks.com/firebase-react-part-2-user-authentication/",
  "https://blog.daftcode.pl/bugs-in-production-the-dirty-dozen-107afe278b94",
  "https://klim.co.nz/retail-fonts/family/",
  "https://builder.io/content/f9b2e832b40246018ede59f16fbabb19/edit",
  "https://buttons.ibelick.com/",
  "https://www.nutsdev.com/?ref=unsection.com",
  "https://onepagelove.com/",
  "https://www.joshwcomeau.com/css/interactive-guide-to-grid/",
  "https://www.collletttivo.it/typefaces/mazius-display",
  "https://www.magicpattern.design/",
  "https://velvetyne.fr/fonts/le-murmure/",
  "https://velvetyne.fr/fonts/anthony/",
  "https://velvetyne.fr/fonts/gulax/",
  "https://velvetyne.fr/fonts/karrik/",
  "https://fonts.google.com/specimen/Syne?query=syne&preview.text=cult%20%2F%20ui",
  "https://velvetyne.fr/fonts/jgs-font/",
  "https://velvetyne.fr/fonts/trickster/",
  "https://freesets.vercel.app/icons",
  "https://velvetyne.fr/fonts/avara/",
  "https://avvvatars.com/",
  "https://vercel.com/blog/building-a-fast-animated-image-gallery-with-next-js",
  "https://uiverse.io/",
  "https://hypercolor.dev/",
  "https://cleanmyseo.com",
  "https://babeljs.io/repl/",
  "https://thebookofshaders.com/02/",
  "https://egghead.io/courses/getting-started-with-redux",
  "https://css-tricks.com/intro-firebase-react/",
  "https://svgdoodles.com/",
  "https://github.com/gitname/react-gh-pages",
  "https://www.collletttivo.it/typefaces/mazius-display/",
  "https://www.tunera.xyz/",
  "https://www.curated.design/",
  "https://gist.github.com/mackenziechild/035fc7c96d648b4eada1f5d9ba4eb2dc",
  "https://github.com/vuejs/vue",
  "https://github.com/youzan/vant",
  "https://github.com/thedaviddias/Front-End-Checklist",
  "https://designresourc.es/",
  "https://blog.bitsrc.io/8-react-application-deployment-and-hosting-options-for-2019-ab4d668309fd",
  "https://fonts.google.com/specimen/Space+Grotesk",
  "https://www.futurefonts.xyz/jtd/oculi",
  "https://uiverse.io/patterns",
  "https://www.futurefonts.xyz/slobzheninov/relaate",
  "https://fonts.google.com/specimen/Archivo",
  "https://fonts.google.com/specimen/Public+Sans",
  "https://fonts.google.com/specimen/Work+Sans",
  "https://www.futurefonts.xyz/fonts?sort=random&page=1&limit=24&license_type=web",
  "https://www.futurefonts.xyz/ryan-bugden/meekdisplay",
  "https://www.futurefonts.xyz/teo-tuominen/ra",
  "https://www.futurefonts.xyz/duong-tran/lavishe",
  "https://www.futurefonts.xyz/studiotriple/digestive",
  "https://www.futurefonts.xyz/phantom-foundry/phantom-sans",
  "https://velvetyne.fr/fonts/sligoil/",
  "https://www.builtatlightspeed.com/",
  "https://framermotionexamples.com/",
  "https://velvetyne.fr/fonts/backout/",
  "https://web3templates.notion.site/Tailwind-CSS-Snippets-4131be7486574f2c9fe0f2e3714bb9d8",
  "https://www.uilabs.dev/",
  "https://buildui.com/",
  "https://type-department.com/collections/sans-serif-fonts/products/rotonto/",
  "https://velvetyne.fr/fonts/terminal-grotesque/",
  "https://variantvault.chrisabdo.dev/",
  "https://platejs.org/?builder=true",
  "https://neobrutalism-components.vercel.app/shadcn/components/button",
  "https://shadcn-extension.vercel.app/docs/carousel",
  "https://www.grillitype.com/typeface/gt-walsheim",
  "https://www.fontshare.com/",
  "https://uncut.wtf/",
  "https://maximalexpression.notion.site/SHADER-PROTOTYPING-146da33982c54746a0589ebcbdbf717a",
  "https://www.advancedframer.com/",
  "https://www.theleagueofmoveabletype.com/",
  "https://shapes.framer.website/",
  "https://velvetyne.fr/",
  "https://shape.so/browse",
  "https://www.shadergradient.co/",
  "https://openverse.org/",
  "https://supply.family/shop/dune-30-gradient-backgrounds/",
  "https://supply.family/shop/squeezer-1-36-abstract-backgrounds/",
  "https://fonts.google.com/specimen/Crimson+Text",
  "https://supply.family/shop/gradient-blend-noise-1/",
  "https://danielsun.space/",
  "https://www.nutsdev.com/",
  "https://fontsfree.pro/base-web-fonts/sans-serif-grotesque/231-aktiv-grotesk-corp.html",
  "https://www.atipofoundry.com/fonts/brockmann",
  "https://components.bridger.to/",
  "https://csspro.com/",
  "https://www.myfonts.com/collections/pf-din-text-pro-font-parachute",
]

const main = async () => {
  console.log("Starting the pipeline...")
  try {
    console.log("Step 1: Crawl and save raw data")
    await crawlAndSave(SEED_URLS)
    console.log("Step 1 completed successfully")

    console.log("Step 2: Enrich the latest raw data")
    await enrichLatestData()
    console.log("Step 2 completed successfully")

    console.log("Step 3: Seed the database with the enriched data")
    await seedDatabase()
    console.log("Step 3 completed successfully")

    console.log("Pipeline completed successfully")
  } catch (error) {
    console.error("Error in main process:", error)
  }
}

main()
