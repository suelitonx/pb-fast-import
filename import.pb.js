/// <reference path="../pb_data/types.d.ts" />

$app.rootCmd.addCommand(new Command({
    use: "import",
    run: (cmd, args) => {
        if (args.length < 2) {
            console.log('Usage: pocketbase import <path_to_folder> <collection_name>')
            return
        }

        const colName = args[1]
        const baseFolder = args[0];

        try {
            $app.findCollectionByNameOrId(colName)
            console.log(`[OK] collection ${colName} already exists`)
        } catch (e_ok) {
            console.log(`[ERROR] collection ${colName} does not exist`)
            return
        }

        let folderFiles = $os.readDir(baseFolder)

        if(folderFiles.length == 0)
        {
            console.log(`[ERROR] folder ${baseFolder} is empty`)
            return
        }

        const papa = require(`${__hooks}/papaparse.min.js`)

        let output = '.mode csv\n.separator ";"\n'

        let columns = '';

        for (let i = 0; i < folderFiles.length; i++) {
        
            let name = folderFiles[i].name()
            
            if(name.endsWith(".csv"))
            {
                let fileName = (baseFolder + '/' + name).replaceAll(/\\/g, '/');
    
                if(columns == '')
                {
                    const file = String.fromCharCode.apply(null, $os.readFile(fileName))
    
                    const config = {
                        dynamicTyping: true,
                        header: false,
                        delimiter: ";",
                    }
                    const r1 = papa.parse(file, config)
    
                    columns = r1.data[0]
                }
    
                output += "\nDROP TABLE IF EXISTS temp_import;\n"
                output += `CREATE TABLE temp_import (${columns});\n`
    
                output += `.import --skip 1 "${fileName}" temp_import\n`
                output += `INSERT INTO ${colName} (${columns}) SELECT ${columns} FROM temp_import;\n`
            }
            
        }

        try {
            $os.remove(baseFolder + '/import.sql')
        } catch (error) {
            console.log(`[ERROR] DELETE IMPORT.SQL: ${error}`)
        }

        $os.writeFile(baseFolder + '/import.sql', output)

        let sqlite = (`${__hooks}/sqlite3.exe`).replaceAll(/\\/g, '/');
        let db = ($os.getwd() + '\\pb_data\\data.db').replaceAll(/\\/g, '/');
        let script = (baseFolder + '\\import.sql').replaceAll(/\\/g, '/');

        console.log(`[OK] executing script ${script}`)
        console.log(`[OK] sqlite ${sqlite}`)
        console.log(`[OK] db ${db}`)
        console.log(`[OK] script ${script}`)

        try {
            let cmd = $os.cmd(sqlite, db, `.read "${script}"`);

            const output_cmd = toString(cmd.output());

            console.log(`[OK] output: ${output_cmd}`)

        } catch (error) {
            console.log(`[ERROR] ${error}`)
        }
        
    },
}))
