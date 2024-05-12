#!/bin/bash

set -ex

for w in $( yarn --silent workspaces info | jq -r 'keys[]' ) ; do
  yarn workspace $w run prettier &
done
wait

for w in $( yarn --silent workspaces info | jq -r 'keys[]' ) ; do
  yarn workspace $w run lint &
done
wait

ruby -rjson <<'RUBY' | $SHELL
data = JSON.parse(`jq '[input_filename, [(.references // [])[].path]]' dropbox-hacking-*/tsconfig.json | jq --slurp -c`)
refs = data.to_h
refs.transform_keys! { |k| k.sub("/tsconfig.json", "") }
refs.transform_values! { |l| l.map { |k| k.sub("../", "") } }
satisfied = []
unsatisfied = refs.keys

while !unsatisfied.empty?
  can_satisfy = unsatisfied.select { |m| (refs[m] - satisfied).empty? }
  raise "Stuck!" if can_satisfy.empty?

  satisfied += can_satisfy
  unsatisfied -= can_satisfy

  can_satisfy.each do |m|
    puts "yarn workspace #{m} compile &"
  end
  puts "wait"
  puts
end
RUBY

exit
