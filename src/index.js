const fs = require('fs');
const Nightmare = require('nightmare');
const cheerio = require('cheerio');
const nightmare = Nightmare({ show: false });

const url = 'https://www.besthavenkhaoyai.com/Best_Und_Haven_Und_Pool_Und_Villa_Und_Khao_Und_Yai/5cdce5a7184a6f001af3600b';
const nameSelector = "#contentnewmode5cde31726972d6001b1ac635 > div.none-border > div > div.none-middle > div.none-middle-mid > div > div > div:nth-child(1) > div:nth-child(1) > span";
const shortDetailSelector = "#contentnewmode5cde31726972d6001b1ac635 > div.none-border > div > div.none-middle > div.none-middle-mid > div > div > div:nth-child(1) > div:nth-child(4)";

nightmare
  .goto(url)
  .wait('section')
  .evaluate(() => document.querySelector('section').innerHTML)
  .end()
  .then(res => {
    const data = getData(res);
    console.log('data:', data);
    const { house } = data;
    const fileName = toFileName(house ? house.name || 'house_data' : 'house_data');
    writeJsonFile(data, fileName);
  }).catch(err => {
    console.log(err);
  });

const getData = (html) => {
  const $ = cheerio.load(html);
  const name = $(nameSelector).text();

  let shortDetail = '';
  $(shortDetailSelector).children().each((idx, elem) => {
    shortDetail += $(elem).text();
  });

  const longDetails = getDivContentListData($, 'รายละเอียดเพิ่มเติม');
  const termAndConditions = getUlContentListData($, 'กฎระเบียบบ้านพัก');
  const nearlyRestaurants = getUlContentListData($, 'ร้านอาหารและคาเฟ่ใกล้เคียง');
  const nearlyLandmarks = getUlContentListData($, 'สถานที่และแหล่งท่องเที่ยวใกล้เคียง');
  const checkIn = getTimeFromText($("span:contains('Check In')").text());
  const checkOut = getTimeFromText($("span:contains('Check Out')").text());
  const minPerson = '';
  const maxPerson = getFirstNumberFromText($("span:contains('พักสูงสุดได้')").text());

  const house = {
    name,
    short_detail: shortDetail,
    long_detail: longDetails,
    term_and_condition: termAndConditions,
    nearly_restaurant: nearlyRestaurants,
    nearly_landmark: nearlyLandmarks,
    check_in: checkIn,
    check_out: checkOut,
    min_person: minPerson,
    max_person: maxPerson,
  };

  const images = [];
  $('div.imgLightbox').each((idx, elem) => {
    const isHighlight = $(elem).has('div').length;
    images.push({
      url: $(elem).find('img').attr('src'),
      highlight: !!isHighlight,
    })
  });


  const detailIcons = getIconData($, "รายละเอียดบ้านพัก");
  const facilityIcons = getIconData($, "สิ่งอำนวยความสะดวก");

  return {
    house,
    images,
    detail_icons: detailIcons,
    facility_icons: facilityIcons,
  };
};

const getDivContentListData = ($, titleText) => {
  const data = [];
  const matchedElem = $(`span:contains(${titleText})`);
  if (matchedElem) {
    matchedElem
      .parent("div")
      .next("div")
      .children()
      .each((idx, elem) => {
        if (elem.tagName === 'br') {
          return false;
        }
        const text = $(elem).find('span').text();
        data.push(text);
      });
  }
  return data;
};

const getUlContentListData = ($, titleText) => {
  const data = [];
  const matchedElem = $(`span:contains(${titleText})`);
  if (matchedElem) {
    matchedElem
      .parent("div")
      .next("ul")
      .children()
        .each((idx, elem) => {
        const text = $(elem).text();
        data.push(text);
      });
  }
  return data;
};

const getIconData = ($, titleText) => {
  const data = [];
  const parentElems = $(`span:contains(${titleText})`).parents("div[id^='contentnewmode']");
  if (parentElems && parentElems.length) {
    const parent = $(parentElems[0]);
    parent.nextUntil(".visible-md.visible-lg", "div[id^='mainmenu']").each((rowIdx, rowElem) => {
      const row = $(rowElem);
      row.find(".content-inline-data").each((colIdx, colElem) => {
        const col = $(colElem);
        const src = $(col.find("img[id^='myImage']").get(0)).attr('src');
        const text = $(col.find("span").get(0)).text();
        data.push({ url: src, description: text });
      });
    });
  }
  return data;
};

const getFirstNumberFromText = (text) => {
  if (text) {
    const found = text.match(/\d+/g);
    if (found && found.length) {
      return found[0];
    }
  }
  return '';
};

const getTimeFromText = (text) => {
  if (text) {
    return text.match(/\d+/g).join(':');
  }
  return '';
};

const writeJsonFile = (obj, fileName) => {
  const content = JSON.stringify(obj);
  fs.writeFile(`./${fileName}`, content, err => {
    if (err) {
      console.log('Error writing file', err);
    }
  });
};

const toFileName = (name) => {
  return `${name.replace(/ /g, '_').toLowerCase()}.json`;
};
