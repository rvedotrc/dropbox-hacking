for x in dropbox-hacking-* ; do
    for y in dropbox-hacking-* ; do
        if [ $x = $y ] ; then continue ; fi

        ack -wl $y $x/src > /dev/null ; src_uses=$?
        ack -wl $y $x/package.json > /dev/null ; pkg_uses=$?
        ack -wl $y $x/tsconfig.json > /dev/null ; tsc_uses=$?

        if [ "$src_uses $pkg_uses $tsc_uses" != "1 1 1" ] ; then
            echo "$x\t$y\t$src_uses\t$pkg_uses\t$tsc_uses"
        fi
    done
done