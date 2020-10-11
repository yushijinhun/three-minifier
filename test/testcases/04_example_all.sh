#!/bin/bash

readarray -td '' files < <(
	find examples/jsm \
		\( \
		-path examples/jsm/libs \
		\) -prune -o \
		-name "*.js" \
		-print0
)

modules=("${files[@]/.*/}")
for module in "${modules[@]}"; do
	module_basename=${module##*/}
	echo "import * as m_$module_basename from \"three/$module\";"
	echo "console.log(m_$module_basename);"
	echo
done
