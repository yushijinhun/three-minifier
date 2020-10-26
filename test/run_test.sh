#!/bin/bash
# $1; testcases: test_case_name | "all" | ""
# $2; components: comma-separated list | "all" | ""

set -e
shopt -s extglob

if [[ "$2" == "all" ]] || [[ "$2" == "" ]]; then
	declare -a components
	for filename in *; do
		if [ -d "$filename" ] && [ -f "$filename/package.json" ]; then
			components+=($filename)
		fi
	done
else
	IFS=',' read -r -a components <<<$2
fi

result_file=$(mktemp)

# $1; line: string
logr() {
	echo "$1" >>$result_file
	echo -e "\e[7m\e[1;32m$1\e[0m"
}

fsize() {
	numfmt --to=si --format=%.2f -- $1
}

# $1; component: "rollup" | "webpack"
# $2; test_case: test_case_name
run_test_with_component() {
	pushd $1 > /dev/null
	if [ -f "../testcases/$2.sh" ]; then
		pushd node_modules/three > /dev/null
		"../../../testcases/$2.sh" >../../index.js
		popd > /dev/null
	else
		cp "../testcases/$2.js" index.js
	fi
	npm run test:control
	npm run test:experimental
	local size_control=$(stat -c '%s' dist_control/index.js)
	local size_experimental=$(stat -c '%s' dist_experimental/index.js)
	logr "Test $2: $1: $(fsize $size_control) => $(fsize $size_experimental) ($(fsize $(( $size_experimental - $size_control ))), $(bc -l <<<"x=$size_control;y=$size_experimental;z=(y-x)*100/x;scale=2;z/1")%)"
	popd > /dev/null
	if [ "$size_experimental" -gt "$size_control" ]; then
		positive_filesize_change=true
	fi
}

# $1; test_case: test_case_name
run_test() {
	for component in "${components[@]}"; do
		run_test_with_component "$component" "$1"
	done
}

positive_filesize_change=false

if [[ "$1" == "all" ]] || [[ "$1" == "" ]]; then
	readarray -td '' test_files < <(find testcases -type f \( -name "*.js" -o -name "*.sh" \) -print0 | sort -z)
	tests=("${test_files[@]//+(*\/|.*)/}")
	for testcase in "${tests[@]}"; do
		run_test "$testcase"
	done
else
	run_test "$1"
fi

echo
echo -e "\e[7m\e[1;32mResults:\e[0m"
cat $result_file
rm -f $result_file

if [[ "$positive_filesize_change" == "true" ]]; then
	echo -e "\e[7m\e[1;31mERROR\e[0m There is a positve filesize change in some bundle!"
	exit 1
fi
