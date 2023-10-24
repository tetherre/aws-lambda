import puppeteerExtra from "puppeteer-extra";
import stealthPlugin from "puppeteer-extra-plugin-stealth";
import chromium from "@sparticuz/chromium";

const removeSymbols = (string) => {
  return string.replace(/[!-\/:-@[-`{-~]/g, "");
};
//
//
//
async function redfinAddressScrape(mlsOrAddress) {
  try {
    puppeteerExtra.use(stealthPlugin());

    // const browser = await puppeteerExtra.launch({
    //   executablePath:
    //     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    //   headless: "new",
    //   defaultViewport: null,
    // });

    const browser = await puppeteerExtra.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(0);

    await page.goto("https://www.redfin.com/");
    console.log("launched");

    await page.type("#search-box-input", mlsOrAddress, { delay: 0 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      page.click(".inline-block.SearchButton.clickable.float-right"),
    ]);
    console.log("waiting");

    const infoX = await page.$$("[class='statsValue']");
    const [price, bedrooms, bathrooms, sqft] = await Promise.all([
      (await infoX[0].getProperty("textContent")).jsonValue(),
      (await infoX[1].getProperty("textContent")).jsonValue(),
      (await infoX[2].getProperty("textContent")).jsonValue(),
      (await infoX[3].getProperty("textContent")).jsonValue(),
    ]);
    console.log(price);
    console.log(bathrooms);
    console.log(bedrooms);
    console.log(sqft);

    const addressX = await page.$("[class='street-address']");
    const address = await (
      await addressX?.getProperty("textContent")
    )?.jsonValue();
    console.log("address: " + address);

    const cityStateZipX = await page.$("[class='dp-subtext bp-cityStateZip']");
    const cityStateZip = await (
      await cityStateZipX?.getProperty("textContent")
    )?.jsonValue();
    console.log(cityStateZip);
    const city = cityStateZip?.split(",")[0];
    const state = cityStateZip?.split(",")[1].split(" ")[1];
    const zip = cityStateZip?.split(",")[1].split(" ")[2];

    const lotSizeX = await page.$$("[class='table-value']");
    const lotSize = await (
      await lotSizeX[4].getProperty("textContent")
    ).jsonValue();
    console.log(lotSize);

    const mlsX = await page.$("[class='ListingSource--mlsId']");
    const mls = await (await mlsX?.getProperty("textContent"))?.jsonValue();
    console.log(mls);

    const previewX = await page.$(".landscape");
    const previewSrc = (await previewX?.getProperty("src"))?.jsonValue();
    const promise = new Promise((resolve) => {
      resolve(previewSrc);
    });
    const preview = await Promise.resolve(promise);
    console.log(preview);

    const pages = await browser.pages();
    await Promise.all(pages.map(async (page) => page.close()));
    console.log("closed");

    const res = {
      data: {
        preview: preview,
        mls: removeSymbols(mls),
        price: removeSymbols(price),
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        sqft: removeSymbols(sqft),
        lot_Size: lotSize,
        city: city,
        state: state,
        zip: zip,
      },
    };

    const mlsData = JSON.stringify(res);
    console.log(mlsData);

    return mlsData;
  } catch (error) {
    console.log("error at the scrape", error.message);
  }
}
//
//
//
// export const handler = async (event, context) => {
//     try {
//       console.log("started");
//       const body = JSON.parse(event.body);
//       const { mlsOrAddress } = body;

//       const data = await redfinAddressScrape(mlsOrAddress);
//       console.log("Handler Data:", data);

//       return {
//         statusCode: 200,
//         body: JSON.stringify(data),
//       };
//     } catch (error) {
//       console.log("error with index.js", error.message);
//       return {
//         statusCode: 500,
//         body: JSON.stringify({
//           message: error.message,
//         }),
//       };
//     }
//   };
