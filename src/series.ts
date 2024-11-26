import axios from 'axios';
import fs from 'fs';
import fsExtra from 'fs-extra';
import { seriesIds } from './data';

async function fetchSeriesName(id: string): Promise<string> {
  const res = await axios.get(`https://www.filmweb.pl/api/v1/film/${id}/preview`, {
    headers: {
      'X-Locale': 'pl_PL',
    },
  });
  return (res.data.title ?? res.data.originalTitle).title;
}
async function fetchSeriesSeasonCount(id: string): Promise<number> {
  const res = await axios.get(`https://www.filmweb.pl/api/v1/serial/${id}/seasons`, {
    headers: {
      'X-Locale': 'pl_PL',
    },
  });
  return res.data.length;
}
async function fetchEpisodesData(id: string): Promise<{ duration?: number }[]> {
  const res = await axios.get(`https://www.filmweb.pl/api/v1/serial/${id}/episodes`, {
    headers: {
      'X-Locale': 'pl_PL',
    },
  });
  return res.data;
}
async function fetchEpisodesDataForSeason(id: string, season: number): Promise<{ duration?: number }[]> {
  const res = await axios.get(`https://www.filmweb.pl/api/v1/serial/${id}/season/${season}/episodes`, {
    headers: {
      'X-Locale': 'pl_PL',
    },
  });
  return res.data;
}
async function fetchSeasonDuration(id: string, season?: number): Promise<{ episodes: number; duration: number }> {
  const data = season ? await fetchEpisodesDataForSeason(id, season) : await fetchEpisodesData(id);
  const episodes = data.filter(v => v.duration);
  const duration = episodes.reduce((acc, v) => acc + v.duration!, 0);
  return { episodes: episodes.length, duration };
}

export async function generateSeriesData() {
  let totalDurations = 0;
  const infos = [];
  for (let i = 0; i < seriesIds.length; i++) {
  // for (let i = 0; i < 1; i++) {
    const id = seriesIds[i];
    const name = await fetchSeriesName(id);
    const seasons = await fetchSeriesSeasonCount(id);
    const info = { name, seasons: [] as any[], totalDuration: 0 };
    if (seasons === 0) {
      const seasonData = await fetchSeasonDuration(id);
      if (seasonData.episodes === 0) continue;

      info.totalDuration += seasonData.duration;
      info.seasons.push(seasonData);
    } else {
      for (let j = 1; j <= seasons; j++) {
        const seasonData = await fetchSeasonDuration(id, j);
        if (seasonData.episodes === 0) continue;

        info.totalDuration += seasonData.duration;
        info.seasons.push(seasonData);
      }
    }
    console.log(name);
    infos.push(info);
    totalDurations += info.totalDuration;

    infos.sort((a, b) => b.totalDuration - a.totalDuration);

    fsExtra.ensureDirSync('out/');
    fs.writeFileSync('out/series.json', JSON.stringify({ total: totalDurations, series: infos }, null, 2));
  }
  console.log(totalDurations / 60);
}

generateSeriesData();