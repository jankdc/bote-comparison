# bote-comparison

As fair as I could I write it, a reproduction of the comparison table from the [`bote` README](https://github.com/jankdc/bote), 
run against the canonical 181 MB [`citylots.json`](https://github.com/zemirco/sf-city-lots-json) GeoJSON.

Each approach runs a task to output the top 10 tallied streets in San Francisco.

```sh
npm install
curl -L -o citylots.json https://raw.githubusercontent.com/zemirco/sf-city-lots-json/refs/heads/master/citylots.json
./bench.sh
```

## Notes

- See `./bench.sh` for instructions
- Requires v22 Node.js, `hyperfine` and MacOS' `/usr/bin/time` for this script to work
- Not all approaches are completely equal because some libraries don't have support for selective materialization (see below)

## Caveat

Honestly, I'm not really sure how to write this benchmark. I could go on the path of apples-for-apples execution
and value materialization with other libraries to fairly represent how those libraries got to where they are in terms
of memory and compute. However, on the other pendulum, it feels like I'm doing a disservice to the design of bote and other libraries that
support being able to do better, whilst achieving the same output.

Overall, I think the point of this benchmark is to shine what bote can do and do well, not to be too neutral about
stuff, whilst still being transparent about why it's doing well.

In that spirit, all opinions and contributions are welcome to try and make this better :)
