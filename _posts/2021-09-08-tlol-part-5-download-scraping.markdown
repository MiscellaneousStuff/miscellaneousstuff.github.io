---
layout: post
comments: true
title:  "TLoL: Human level in League of Legends using Deep Learning (Part 5 - Download Scraping)"
excerpt: "In summary, we are now able to find a list of relevant replay files using u.gg. Next we
will need to use the League Client Update to download the *.rofl files automatically."
date:   2021-09-08 18:00:00
categories: [Project]
tags: ["League of Legends", "Machine Learning", "Reinforcement Learning", "TLoL", "Data Scraping"]
---

## Table of Contents

* TOC
{:toc}

## Introduction

Following the conclusions of [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html), we will be implementing the first system out of the two
systems which need to be created to extract data from replays which we need. The first system
was the **Automated Replay Downloader**. The **Automated Replay Downloader** is responsible
for downloading replays matching a certain criteria. What we will find in this post, is that
the assumptions and evidence presented in [part 3](https://miscellaneousstuff.github.io/project/2021/09/03/tlol-part-3-initial-ideas.html) are incorrect, and luckily for us,
were far too pessimistic.

## Overview

The basic idea behind the replay scraping is to find replays which match a certain criteria,
build a list of game IDs which match the criteria and download the list of replays. There are
many criterias which can be used to determine which replays need to be downloaded. From the
literature review, we found that the JueWu-SL system was largely successful because of their
data selection process within their method.

The rough criteria used in their system for deciding which replays to download include the
following:

### Top 1% of Players

All of the replays came from the top 1% of players. For the League AI system, I will be
using replays from the Europe West (EUW) region which is widely considered to be the best 
region outside of the best region in China and the Korean (KR) region.

### 100,000,000 Samples

The paper also describes how the final dataset is comprised of 100 million data samples.
The paper doesn't clearly indicate what a sample is, this could either be a frame
(a single observation of the game at a single point in time), or this could refer to
scenes. Scenes are collections of observations which relate to a single instance of
something happening in the game. For instance, the `Combat` scene refers to players
fighting against each other, the `Navigation` scene refers to players moving from
one global intent region to another. For further details, refer to [part 4](https://miscellaneousstuff.github.io/project/2021/09/04/tlol-part-4-exploring-the-literature.html).

For our system, we can calculate how many replays are required to get us 100,000,000
samples. In theory, if the average high elo game in EUW takes [26 minutes to complete](https://www.leagueofgraphs.com/rankings/game-durations),
including games which end in surrender, then:

```python
obs_per_sec  = 8  # Observations per second
secs_per_min = 60 # Seconds per minute
obs_per_min = secs_per_min * obs_per_sec
mins_per_game = 26 # Mins per Game
obs_per_game = mins_per_game * obs_per_min
obs_per_game := 12480
min_games = 100,000,000 / obs_per_game
min_games := 8012.820 # Minimum games required to get 100M frames for training
```

So from those calculations, we can see that it takes a minimum of 8,012 games to
reach our target frame count of 100,000,000 if we're recording 8 frames per second
during a game.

However, if we only download the minimum number of games which we may need, that
doesn't give us the flexibility to process more games if the quality of the games
which covers the 100M frames is poor in some of the games. For that reason, I will
download 10,000 games, as that gives an additional 2,000 games for this stage which
in theory means we have a maximum **124,810,000** frames available, so we can
disregard **24,810,000**, or roughly 25% of the dataset if it's not suitable.

### Selecting League Replays

Now we know that we want to download **10,000** replays, we need to select a champion
to download the replays for. The reason why we want to download replays of just a single
champion, is because trying to create a system which is general enough to learn from
observing multiple champions and roles is very complicated. OpenAI Five, AlphaStar and
other game playing AI systems all train models to play either one hero, or one race,
respectively. The question of how to create a model which can generally learn to play
as champions, which have different action spaces, is an open problem.

For that reason, I will be downloading **10,000** replays for a single champion. I will
also be downloading replays only where the player playing the selected champion won the game.
From the research this seems to be a standard procedure as, in theory, if a player won the game, they are more likely to have been playing better and contributed to winning the game.

### Selecting a Champion

I will be choosing Ezreal as the champion to scrape replays for, for several reasons.

The
first reason will be that Ezreal is a relatively simple champion mechanically as all of
his abilities are simple skillshots. Also, the attack damage carry (ADC) role should in theory be the easiest
role to learn macro (deciding where on the map an action should take place next).

This
can be seen from the provided Jupyter Notebook where you can see the activity heatmaps
in different global intent regions per role. The ADC role shows the least variety compared
to other roles and strongly clusters in the bot lane (bottom-right side of the map).

Another reason is that, the [LoLRLE](https://github.com/MiscellaneousStuff/pylol) project
contains an implementation of Ezreal (the LoLRLE uses a League Server emulation, and
has implemented Ezreal relatively well). This means that we can test what the model has
learned without having to rely on the game client.

## Method

### Finding Matches for our Criteria

#### OP.GG

For starters, which need an API which allows us to query League of Legends match data
at a rate which we require. Unfortunately, the Riot Developer API is very highly rate
limited for non-production apps. One way around this is to use the APIs of production
services which already have approval from Riot. The two main services which are used
to access bulk user data are [op.gg](https://op.gg/) and [u.gg](https://u.gg/).

The first website, [op.gg](https://op.gg/), is the oldest website around which is
used by League of Legends players to query global statistics relating to the game such
as which champions are popular, which items players build when playing champions,
how many games have been played of each champion during a certain time frame and many
other statistical queries.

My experience with using the [op.gg](https://op.gg/) API was that the API was clearly
developed in a haphazard way. Calls to the [op.gg](https://op.gg/) API are returned
in the HTML form which the [op.gg](https://op.gg/) client is expected to interpret.
For example, getting the matches for a single player, `ZWYRØØ`
requires this API call (as of 08/09/2021):

```bash
curl 'https://euw.op.gg/summoner/matches/ajax/averageAndList/startInfo=1630324814&summonerId=84676869' \
  -H 'authority: euw.op.gg' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'x-datadog-origin: rum' \
  -H 'x-datadog-sampling-priority: 1' \
  -H 'accept: application/json, text/javascript, */*; q=0.01' \
  -H 'x-requested-with: XMLHttpRequest' \
  -H 'x-datadog-sampled: 1' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-site: same-origin' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-dest: empty' \
  -H 'referer: https://euw.op.gg/summoner/userName=ZWYR%C3%98%C3%98' \
  -H 'accept-language: en-GB,en-US;q=0.9,en;q=0.8' \
  --compressed;
```

This results in this code where only a portion of it is shown as the average response
is above 200KB!

<div style="text-align: center;">
   <img
      src="/assets/op_gg/api_madness.png"
      style="width: 100%; max-width: 640px;"
   />
</div>

As you can see, the API mixes document object model (DOM) information, along with
the data which the user is actually requesting. This is terrible as it heavily
increases the bandwidth usage of the website for the host and the client. It also
makes the code less robust to any future changes as the API has multiple responsibilities;
it's responsible for returning match data and includes code which is meant to style the
website. For this reason, I started investigating [u.gg](https://u.gg/) for querying
the Riot API.

#### U.GG

On the otherhand, the [u.gg](https://u.gg/) API was clearly designed better. All
calls to the [u.gg](https://u.gg/) API are made through the same url: `https://u.gg/api`.
Then in the request body, the required operation `operationName` is specified along
with the `query` and the `variables` relating to the query. An example of getting
the players within a leaderboard page (e.g. page 1 contains the top 100 players in a
region, page 2 contains the next 100 players in a region, etc.) is shown below:

```python
import concurrent.futures
import request
import time

CONNECTIONS = 10

def handle_req(url, body):
    req = requests.request(
        'POST',
        url,
        data=json.dumps(body),
        headers={
            "Content-Type": "application/json"
        }
    )
    time.sleep(0.5)
    return req

def get_leaderboard(page_start=1, page_end=1):
    players = []
    leaderboard_url = "https://u.gg/api"

    leaderboard_req_body = lambda p: {
        "operationName": "getRankedLeaderboard",
        "query": "query getRankedLeaderboard($page: Int, $queueType: Int, $regionId: String!) {\n  leaderboardPage(page: $page, queueType: $queueType, regionId: $regionId) {\n    totalPlayerCount\n    topPlayerMostPlayedChamp\n    players {\n      iconId\n      losses\n      lp\n      overallRanking\n      rank\n      summonerLevel\n      summonerName\n      tier\n      wins\n      __typename\n    }\n    __typename\n  }\n}\n",
        "variables": {
            "page": p,
            "queueType": 420, # Ranked Solo/Duo
            "regionId": "euw1"
        }
    }

    with concurrent.futures.ThreadPoolExecutor(max_workers=CONNECTIONS) as executor:
        future_to_summoner_name = (executor.submit(
            handle_req,
            leaderboard_url,
            leaderboard_req_body(page+1)
        ) for page in range(page_start, page_end+1))
        for future in concurrent.futures.as_completed(future_to_summoner_name):
            try:
                data = future.result()
                data = json.loads(data.content)
                data = data["data"]["leaderboardPage"]["players"]
            except Exception as exc:
                data = str(type(exc))
            finally:
                players += data
    
    return players
```

The code above allows a user to query the [u.gg](https://u.gg/) API to find the summoner
names of players between a range of leaderboard pages (because the API is paginated
throughout). The inclusion of the `concurrent.futures` module along with the `time`
module allow the process to be heavily accelerated by using multiple threads to
request data simultaneously, while waiting 0.5 seconds between requests on each thread
to prevent us being blocked by the API. This is also out of respect, as we don't want
to flood the traffic of the website.

Using the summoner names retrieved from the above code, we can then use another function
to get the matches for each summoner which were played on the current patch and where the
player played the champion which we want replays (in this case Ezreal).

The following code allows us to to this:

```python
import concurrent.futures
import request
import time

CONNECTIONS = 10

champ_ids = {}

with open(fname) as f:
    content = f.read()
    lines = content.split("\n")
    for l in lines:
        ln = l.split(":")
        champ = ln[1].strip()
        champ_id = int(ln[0])
        champ_ids[champ] = champ_id

def handle_req(url, body):
    req = requests.request(
        'POST',
        url,
        data=json.dumps(body),
        headers={
            "Content-Type": "application/json"
        }
    )
    time.sleep(0.5)
    return req

def get_matches(self, summoner_names, champs, target_patch, outfile="", win_only=False):
    matches_url = "https://u.gg/api"
    match_ids = set()
    matches_req_body = lambda summoner_name: {
        "operationName": "FetchMatchSummaries",
        "query": "query FetchMatchSummaries($championId: [Int], $page: Int, $queueType: [Int], $regionId: String!, $role: [Int], $seasonId: Int!, $summonerName: String!) {\n  fetchPlayerMatchSummaries(\n    championId: $championId\n    page: $page\n    queueType: $queueType\n    regionId: $regionId\n    role: $role\n    seasonId: $seasonId\n    summonerName: $summonerName\n  ) {\n    finishedMatchSummaries\n    totalNumMatches\n    matchSummaries {\n      assists\n      championId\n      cs\n      damage\n      deaths\n      gold\n      items\n      jungleCs\n      killParticipation\n      kills\n      level\n      matchCreationTime\n      matchDuration\n      matchId\n      maximumKillStreak\n      primaryStyle\n      queueType\n      regionId\n      role\n      runes\n      subStyle\n      summonerName\n      summonerSpells\n      psHardCarry\n      psTeamPlay\n      lpInfo {\n        lp\n        placement\n        promoProgress\n        promoTarget\n        promotedTo {\n          tier\n          rank\n          __typename\n        }\n        __typename\n      }\n      teamA {\n        championId\n        summonerName\n        teamId\n        role\n        hardCarry\n        teamplay\n        __typename\n      }\n      teamB {\n        championId\n        summonerName\n        teamId\n        role\n        hardCarry\n        teamplay\n        __typename\n      }\n      version\n      visionScore\n      win\n      __typename\n    }\n    __typename\n  }\n}\n",
        "variables": {
            "championId": [champ_ids[c] for c in champs],
            "page": 1, # Finds max of 20 games of a single champ per patch (people rarely play more than this so to keep the code much simpler, I'm only checking a maximum of 20 games of the same champion per summoner per patch.)
            "queueType": [420], # 420 = solo/duo
            "regionId": "euw1",
            "role": [],
            "seasonId": 16,
            "summonerName": summoner_name
        }
    }
    
    if outfile:
        # remove old outfile
        try:
            os.remove(outfile)
        except OSError:
            pass
        with open(outfile, "a+") as f:
            f.write(target_patch + "\n")
            f.write(",".join(champs) + "\n")
            f.write(f"top {len(summoner_names)} ranked summoners\n")

    with concurrent.futures.ThreadPoolExecutor(max_workers=CONNECTIONS) as executor:
        future_to_match_id = (executor.submit(
            handle_req,
            matches_url,
            matches_req_body(name)
        ) for name in summoner_names)
        for future in concurrent.futures.as_completed(future_to_match_id):
            try:
                data = future.result()
                data = json.loads(data.content)
                data = data["data"]["fetchPlayerMatchSummaries"]["matchSummaries"]
            except Exception as exc:
                data = str(type(exc))
            finally:
                for match in data:
                    if type(match) == str:
                        print('This replay failed', match, data)
                        break
                    if match["version"] == target_patch:
                        if (win_only and match["win"]) or (not win_only):
                            match_ids.add(match["matchId"])
                            if outfile:
                                with open(outfile, "a+") as f:
                                    f.write(str(match["matchId"]) + "\n")
    return match_ids

if __name__ == "__main__":
    start_idx   = 1  # Start scraping from leaderboard page 1 (1-100 ranked players)
    stop_idx    = 10 # Stop scraping from leaderboard page 10 (900-1000 ranked players)

    champs = ["Ezreal"]

    fname_champlst = ["-".join(c.split(" ")) for c in champs]
    fname_champs = f'{",".join(fname_champlst)}'
    fname_nums   = f"{((stop_idx - start_idx)+1) * 100}({start_idx}-{stop_idx})"
    fname_win_only = f'{"win_only" if win_only else "win_or_loss"}'
    fname = f"{fname_champs}_{fname_nums}_{fname_win_only}.txt"

    leaderboard = get_leaderboard(
        page_start=start_idx,
        page_end=stop_idx)
    players = [p["summonerName"] for p in leaderboard]

    matches = scraper.get_matches(
        summoner_names=players,
        champs=champs, # Logical OR search for these champs
        target_patch="11_17",
        outfile=f"matches/{fname}",
        win_only=win_only
    )

    print("match count:", len(matches))

    game_ids = set()
    files = os.listdir("./matches/")
    for file in files:
        if file.endswith(".txt"):
            path = os.path.join("./matches/", file)
            with open(path, "r") as f:
                content = f.read()
                content = content.split("\n")
                game_ids = game_ids.union(set(content[3:]))

    with open("./matches/game_ids.txt", "w") as f:
        for game_id in game_ids:
            f.write(game_id + "\n")
```

The above code relies on a `champ_ids.txt` file being in the same directory.
This is used to convert between the champion IDs used internally in Riot's APIs
from a champion's name (as of 08/09/2021, which is patch 11.17).
This can be downloaded from [this](https://miscellaneousstuff.github.io/assets/configs/champ_ids.txt) link.

This code snippet will use the [u.gg](https://u.gg/) API to find every match for
every provided summoner which matches the provided criteria (up to 20 games per player, due to
only the first page of results per summoner being checked).
The criteria used is:

- `summoner_names`

    List of summoners to scrape replays from. Use this in conjunction with the 
    `get_leaderboards()` function to scrape replays from the top of the leaderboard. You
    could also get a list of pro players from a website like, [trackingthepros.com](https://www.trackingthepros.com/) and
    use the summoner names to get replays of pro players for training data. This will
    be possibly during the **2021 World Championship** as it is being held in `EUW`,
    which will make it easier to scrape replays from a single region.

- `champs`

    List of champions which need to be present to be included in the search results.
    If this list is empty, it will accept any champion, if the list contains one champion,
    then only games where a summoner played that champion will be returned. However, if
    the `champs` list contains multiple champions, then the search query is logical OR,
    which means if the summoner played any of the champions, then a `gameId` is returned.

- `target_patch`

    The current patch which League of Legends is currently on, for the specified region. I haven't
    included code to set the region, you will just need to find the regionId from Riot's
    documentation, and change the parameters as required. For example, if we are on
    patch 11.17 (which as of 08/09/2021, we are), then this parameter will need to be set
    to `"11_17"`.

- `outfile`

    File path to save the list of gameIds to.

- `win_only`

    Set this to true if you only want to scrape games where a player won. For now, I have
    used this because it is the simplest way to increase the average gameplay quality of
    the replays. This is intuitive, as everything else being the same, a player was more
    likely to win a game over 10,000 games if it was them who played better and if they
    weren't a determine to their team.

From this, we finally get the list of gameIds which match the criteria we want, for the
individual or multiple champions which we want replays for.

## Summary

In summary, we are now able to find a list of relevant replay files using u.gg. Next we
will need to use the League Client Update to download the *.rofl files automatically.

## References

### League Replay Jupyter Notebook

- [TLoL Repository (Contains Notebook and Replay Files)](https://github.com/MiscellaneousStuff/tlol)