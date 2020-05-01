const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const start = 1946;
const yearNb = new Date().getFullYear() - start - 1;
// const yearNb = 10;

const DATA = {}

const init = async () => {
  const array = Array.from({ length: yearNb }, (v, k) => k + start)

  for (const year of array) {
    await getYearStandings(year)
  }

  fs.writeFileSync('STANDINGS.json', JSON.stringify(DATA, null, 2))
}

const fetchData = async (year) => {
  const end = (year + 1).toString().substr(2, 2)
  const url = `https://en.wikipedia.org/wiki/${year}-${end}_NBA_season#Regular_season`;
  console.log(url)
  const result = await axios.get(url);
  return cheerio.load(result.data);
};

const getYearStandings = async (year) => {
  const $ = await fetchData(year);



  const CONTEXTS = [
    $('.wikitable[width="400px"] tbody tr'),
    $('.wikitable[width="60%"] tbody tr'),
    $('.wikitable[width="80%"] tbody tr'),
    $('.wikitable[width="470"] tbody tr'),
  ]

  CONTEXTS.map(ctx => {
    ctx.each((_, element) => {
      let name;
      let wins;

      const DONE = []
      const team = $(element).find('td a').attr('href')
      if (team) {
        const split = team.split('_')
        name = split.splice(1, split.length - 2).join(' ')
      }

      $(element).find('td').each((index, td) => {
        if (td.children && td.children.length && index === 1) {
          wins = parseInt(td.children[0].data.replace('\n', ''), 10)
        }
      })

      // if (name && wins && DONE.indexOf(name) === -1) {
      if (name && wins) {

        if (!DATA[name]) {
          DATA[name] = []
        }

        DATA[name].push({
          year,
          wins
        })
        DONE.push(name)
      }
    });
  })
}

// Launch
init()
