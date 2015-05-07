#!/usr/bin/python

import json
import sys
import re

def main(argv):
	current_key = None
	current_dict = {}
	line = sys.stdin.readline()
	while line:
		line = line.rstrip()
		key, count = line.split('\t')
		count = float(count)
		if current_key == key:
			current_count += count
		else:
			if current_key:
				current_dict.setdefault(current_kwts[0], [])
				current_dict[current_kwts[0]].append([int(current_kwts[1]), current_count])
				#print current_key + '\t' + str(current_count)
			current_key = key
			current_kwts = key.split(',')
			current_count = count
		line = sys.stdin.readline()
	if current_key == key:
		#print current_key + '\t' + str(current_count)
		current_dict.setdefault(current_kwts[0], [])
		current_dict[current_kwts[0]].append([int(current_kwts[1]), current_count])

	output = []
	for key in current_dict:
		current_dict[key].sort(key=lambda x: x[0])
		output.append({'name': key, 'data': current_dict[key]})
	print json.dumps(output)

if __name__ == "__main__":
	main(sys.argv)