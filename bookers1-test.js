// ヘッドレスブラウザ読み込み
const puppeteer = require('puppeteer');


// 非同期関数を定義する関数宣言
// 以下のように関数の前にasyncを宣言することにより、非同期関数（async function）を定義できる

(async () => {
  const browser = await puppeteer.launch({
    headless: false, //trueにするとchromeが裏で立ち上がる→CodeBuildではtrueに設定する
    devtools: true, //デバッグ用
    timeout: 3000, //タイムアウトの時間変更
    slowMo: 30, //少し遅めに設定
    args: ['--no-sandbox', '--disable-setuid-sandbox'] //プロトコルエラー解消のため、不正に操作させない
  });

  // pageはページ全体を示すメソッド
  const page = await browser.newPage();

    // 例外処理の場合け
    try {
        // #########################################################
        // ダイアログの処理を全てOKにする
        page.on('dialog', dialog => {
          console.log('◯削除ボタンのダイアログの設定があります');
          dialog.accept();
        });

        // #########################################################
        // 各リクエストのレスポンスを検知
        page.on('response', response => {
          // console.log(response.status(), response.url()) // 全リクエストのステータスコードとURLをlog
          if (304 > response.status() && 200 <= response.status()) return;
          console.warn('status error', response.status(), response.url()) // ステータスコード200番台以外をlog
          console.log("テストの途中でエラーになりました。該当するテストの処理やclass名・スペルミスがないかもう一度確認してください。")
          process.exit(1)
        });

         // #########################################################
        // 実行したlogをルートディレクトリのdebug.logファイルに吐き出す
        var fs = require('fs');
        var util = require('util');
        var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
        var log_stdout = process.stdout;

        console.log = function(d) {
          log_file.write(util.format(d) + '\n');
          log_stdout.write(util.format(d) + '\n');
        };

        // #########################################################
        // 引数が渡されれば引数のパスに飛ぶ
        var path = process.argv[2];
        var rootPath = function(path){
          if(path == null){
            return "localhost:3000"
          }else{
            return "localhost:3000/" + path ;
          }
        }

        // rootパス定義
        var url = rootPath(path);
        console.log(url);
        if (url == "localhost:3000"){
          console.log("============================")
          // console.log("◯ルートパスが設定してあります");
        }else{
          console.log("============================")
          console.log("△ルートパスの設定をしましょう")
        }

        // #########################################################
        // async function内でPromiseの結果（resolve、reject）が返されるまで待機する(処理を一時停止する)演算子
        // await = Promise(非同期処理)の処理を簡潔かつ、処理が終わるまで待機してくれる
        // ルートページ
        await page.goto(url);
        if (await page.$('a')){
            await page.waitForSelector('a');
            await page.screenshot({path: 'image/top.png'});
        }else{
            console.log('×トップページに"start"リンクがありません')
            process.exit(1)
        }

        // トップページがあるか確認
        var start_button = await page.$eval('a', element =>{
             // Railsのトップページの場合
            if (element.textContent.match('\n')){
                return true
            // トップページにリンクが作成されている場合
            }else{
                return false
            }
        })

        // console.log(start_button);
        if (start_button == true){
            console.log('×トップページが作成されていません');
        }else if (start_button == false){
            console.log('◯ルートパスの設定があります')
            console.log('◯トップページが作成されています');
            await page.click('a');
        }

        // await page.click('a');
        await page.screenshot({path: 'image/bookers1.png'});

        // 遷移したページに投稿フォームがあるかどうか
        console.log("===========================")
            //　投稿用のフォームがある場合
            if (await page.$('.book_title') && await page.$('.book_body') && await page.$('input[type="submit"]')) {
                console.log("◯新規投稿フォームが一覧ページに作成されています")
                await page.waitForSelector('form');
                // #########################################################
                // 投稿のテスト
                console.log("============================")
                console.log('新規投稿のテスト');
                await page.type('.book_title', "50文字投稿");
                await page.type('.book_body', "口頭で伝える際には、多少正確さが欠けていたとしても、相手が足らず分を推測してくれることはよくあります。これが、文章になると、とたんに整合性がないものになってしまいます。普段、文章をあまり書かない人にとって、文字で伝えるのは非常にハードルの高いことです。文章は、書くことを通じてしか、上達の方法はありませんので、従業員のみなさんがトレーニングできる環境を整備することが大切なのです。");
                await page.click('input[type="submit"]');
                await page.waitForSelector('body');
                await page.screenshot({path: 'image/book1.png'})


                // 投稿の内容が反映されているか
                var data = await page.$eval('html', el => {
                    if (el.textContent.match(/50文字投稿/) && el.textContent.match(/口頭で伝える際には、多少正確さが欠けていたとしても/)){
                        // return el.textContent
                        return "◯新規投稿が正しく表示されています"
                    }else if (el.textContent.match(/50文字投稿/)){
                        // return el.textContent
                        return "×感想フォームが保存されていません"
                    }else if (el.textContent.match(/口頭で伝える際には、多少正確さが欠けていたとしても/)){
                        // return el.textContent
                        return "×投稿タイトルが保存されていません"
                    }else{
                        // return el.textContent
                        return "×投稿内容が保存できていません。コントローラの記述等確認しましょう"
                    }
                });
                console.log(data);

                    if (data == "◯新規投稿が正しく表示されています"){
                        // 戻るリンクがあるか
                        if (await page.$('a.back')){
                                await page.click('a.back')
                                console.log('◯新規投稿から詳細ページに遷移しています');
                                await page.waitForSelector('form');
                                    // 一覧画面がテーブルタグを使用しているか確認
                                    if (await page.$('table td')){
                                        await page.waitForSelector('td a');
                                    }else{
                                        console.log("×テーブルタグを使用して、一覧ページに表を作成して下さい")
                                        await page.waitForSelector('a');
                                    }
                                    // #########################################################
                                    // 繰り返し投稿
                                    console.log("============================")
                                    console.log('繰り返し投稿のテスト');
                                    for (var i = 2; i < 7; i++) {
                                        console.log(i + "回目");
                                        await page.type('.book_title', `こんにちは${i}`);
                                        await page.type('.book_body', `${i}回目の投稿`);
                                        await page.click('input[type="submit"]');
                                        // 内容が反映されるまで待機
                                        await page.waitForSelector('body');
                                        await page.screenshot({path: `image/book${i}.png`})
                                        // 投稿の内容が反映されているか
                                        var sub_data = await page.$eval('html', sub_el => {
                                            // console.log(i);
                                            if (sub_el.textContent.match(/こんにちは/) && sub_el.textContent.match(/回目の投稿/)){
                                                return "◯繰り返し投稿が正しく表示されています"
                                            }else if (sub_el.textContent.match(/こんにちは/)){
                                                return "×感想フォームが保存されていません"
                                            }else if (sub_el.textContent.match(/回目の投稿/)){
                                                return "×タイトル用のフォームがありません。formやclass名を確認して下さい。"
                                            }else{
                                                return "×投稿内容が保存できていません。コントローラの記述等確認しましょう"
                                            }
                                        });

                                        console.log(sub_data);
                                        await page.click('a.back');
                                        await page.waitForSelector('a');
                                }
                                // console.log('◯繰り返し投稿ができます');

                                // #########################################################
                                // 空欄投稿
                                console.log("============================")
                                console.log('空欄投稿のテスト');
                                await page.waitForSelector('form');
                                await page.type('.book_title', "");
                                await page.type('.book_body', "");
                                await page.click('input[type="submit"]');

                                // 空欄投稿できたか分岐する
                                if (await page.$('.back')) {
                                  console.log('△空欄で投稿できてしまいます');
                                  await page.waitForSelector('a');
                                  await page.click('a.back');
                                 }else{
                                  console.log('◎空欄投稿できないように、バリデーションがかかっています');
                                  await page.goBack();
                                 }

                                await page.waitForSelector('body');
                                await page.screenshot({path: 'image/new-empty.png'})
                        }else{
                            console.log('△新規投稿後に詳細ページに遷移していません')

                            // 詳細ページに遷移する
                            if (await page.$('.show_1')){
                                await page.click('.show_1');
                                await page.waitForSelector('body');

                                if (await page.$('a.back')){
                                    await page.click('a.back');
                                }else{
                                    console.log("△詳細ページの戻るボタンのclass名やリンクを確認して下さい")
                                    await page.goBack();
                                }
                            }else{
                                console.log("×一覧ページにある詳細ページに遷移するリンクのクラス名が間違えています")
                            }
                            // 一覧ページに戻る
                            await page.waitForSelector('form');
                                // #########################################################
                                // 繰り返し投稿
                                console.log("============================")
                                console.log('繰り返し投稿のテスト');
                                for (var i = 2; i < 7; i++) {
                                    await page.type('.book_title', `こんにちは${i}`);
                                    await page.type('.book_body', `${i}回目の投稿`);
                                    await page.click('input[type="submit"]');
                                    // 内容が反映されるまで待機
                                    await page.waitForSelector('body');
                                    await page.screenshot({path: `image/book${i}.png`})
                                    await page.waitForSelector('form');
                                }
                                console.log('◯繰り返し投稿ができます');

                                // #########################################################
                                // 空欄投稿
                                console.log("============================")
                                console.log('空欄投稿のテスト');
                                await page.waitForSelector('form');
                                await page.type('.book_title', "");
                                await page.type('.book_body', "");
                                await page.click('input[type="submit"]');

                                // 空欄投稿できたか分岐する
                                if (await page.$('.back')) {
                                  console.log('△空欄で投稿できてしまいます');
                                  await page.waitForSelector('a');
                                  await page.click('a.back');
                                 }else{
                                  console.log('◎空欄投稿できないように、バリデーションがかかっています');
                                  await page.goBack();
                                 }

                                await page.waitForSelector('body');
                                await page.screenshot({path: 'image/new-empty.png'})
                        }
                    }else{
                        // 分岐前にログを表示しているため、プロセスのみexitする
                        process.exit(1)
                    }
                await page.screenshot({path: 'image/books.png'})
                await page.waitForSelector('a');

                // 編集リンクが存在するか
                if (await page.$('.edit_1')){
                    // #########################################################
                    // 編集ページ
                    console.log("============================")
                    console.log('編集のテスト');
                    await page.click('.edit_1');

                    // 編集用のフォームが存在するか
                    if (await page.$('.book_title') && await page.$('.book_body') && await page.$('input[type="submit"]')) {
                        await page.waitForSelector('form');
                        await page.type('.book_title', "福沢諭吉");
                        await page.type('.book_body', "「天は人の上に人を造らず人の下に人を造らず」と言えり。されば天より人を生ずるには、万人は万人みな同じ位にして、生まれながら貴賤きせん上下の差別なく、万物の霊たる身と心との働きをもって天地の間にあるよろずの物を資とり、もって衣食住の用を達し、自由自在、互いに人の妨げをなさずしておのおの安楽にこの世を渡らしめ給うの趣意なり。");
                        await page.screenshot({path: 'image/edit1.png'})
                        await page.click('input[type="submit"]');
                        await page.waitForSelector('body');
                        await page.screenshot({path: 'image/update1.png'})

                        // 編集の内容が反映されているか
                        var data = await page.$eval('body', el => {
                            if (el.textContent.match(/福沢諭吉/) && el.textContent.match(/天は人の上に人を造らず人の下に人を造らず」と言えり。/)){
                                return "◯編集内容が正しく表示されています"
                            }else if (el.textContent.match(/福沢諭吉/)){
                                // return el.textContent
                                return "×編集後に感想文が保存されていません"
                            }else if (el.textContent.match(/天は人の上に人を造らず人の下に人を造らず」と言えり。/)){
                                // return el.textContent
                                return "×編集後にタイトルが保存されていません"
                            }else{
                                // return el.textContent
                                return "×編集内容が保存できていません。コントローラの記述等確認しましょう"
                            }
                        });
                        console.log(data);

                        // 編集後に戻るボタンがあるか
                        if (await page.$('a.back')){
                            await page.click('a.back');
                        }else{
                            console.log("×編集後に戻るボタンがありません")
                            // 一覧ページに遷移する
                            await page.goto(url, { waitForSelector: 'a' });
                            await page.click('a');
                        }
                    // 編集フォームにタイトル用のフォームがない場合
                    }else if (await page.$('.book_body') && await page.$('input[type="submit"]')){
                        console.log("============================")
                        console.log("×編集フォームにタイトル用のフォームがありません")
                        console.log("formやclass名を確認して下さい")
                        await page.goBack();
                    // 本の感想用のフォームがない場合
                    }else if (await page.$('.book_title') && await page.$('input[type="submit"]')){
                        console.log("============================")
                        console.log("×編集フォームに本の感想文用のフォームがありません")
                        console.log("formやclass名を確認して下さい")
                        await page.goBack();
                    // #########################################################
                    // 送信ボタンがない場合
                    }else if (await page.$('.book_title') && await page.$('.book_body')){
                        console.log("============================")
                        console.log("×編集フォームの送信ボタンがありません")
                        console.log("submitやclass名を確認して下さい")
                        await page.goBack();
                    // #########################################################
                    // その他
                    }else{
                        console.log("============================")
                        console.log("×編集フォームが見つかりません、クラス名やformを確認して下さい")
                        await page.goBack();
                    }

                    await page.waitForSelector('a');


                    // 削除リンクがあるかどうか
                    if (await page.$('.destroy_1')){
                        // #########################################################
                        // 繰り返し削除
                        console.log("============================")
                        console.log('削除のテスト');
                        // 1件目を削除しよう・・・
                        console.log("1回目");
                        await page.click(`.destroy_1`);
                        // await page.waitForSelector('tbody td a');

                            for (var i = 2; i < 6; i++) {
                                console.log(i + "回目");

                                // 2件目以降の削除を検証する
                                if (await page.$(`.destroy_${i}`)){
                                    if (await page.$(`.destroy_${i-1}`)){
                                        console.log("×削除できません。コントローラの記述を確認して下さい");
                                        process.exit(1);
                                    }else{
                                        await page.click(`.destroy_${i}`);
                                        console.log(`◯${i}件目の削除ができます`);
                                        await page.waitForSelector('a');
                                    }
                                }else{
                                    console.log("×" +i +"件目の削除ボタンが見つかりません。")
                                    await page.screenshot({path: 'image/destroy1.png'})
                                    process.exit(1)
                                }
                            }
                        // #########################################################
                        // 削除後のページをスクショ
                        await page.screenshot({path: 'image/destroy1.png'})
                        // await page.waitForSelector('tbody td a');
                        // console.log('◯削除できます');
                    // 削除リンクがない場合
                    }else{
                        console.log("============================")
                        console.log('×削除のclass名が間違えています');
                    }
                // 編集のリンクが
                }else{
                    console.log("============================")
                    console.log('×編集ページのclass名が間違えています');
                    console.log('×編集ができません');

                    // 削除リンクがあるかどうか
                    if (await page.$('.destroy_1')){
                        // #########################################################
                        // 繰り返し削除
                        console.log("============================")
                        console.log('削除のテスト');
                        // 1件目を削除しよう・・・
                        console.log("1回目");
                        await page.click(`.destroy_1`);
                        // await page.waitForSelector('tbody td a');

                            for (var i = 2; i < 6; i++){
                                console.log(i + "回目");
                                if (await page.$(`.destroy_${i}`)){
                                    if (await page.$(`.destroy_${i-1}`)){
                                        console.log("×削除できません。コントローラの記述を確認して下さい");
                                        process.exit(1);
                                    }else{
                                        await page.click(`.destroy_${i}`);
                                        console.log(`◯${i}件目の削除ができます`);
                                        await page.waitForSelector('a');
                                    }
                                }
                            }
                        // #########################################################
                        // 削除後のページをスクショ
                        await page.screenshot({path: 'image/destroy1.png'})
                    // 削除リンクがない場合
                    }else{
                        console.log("============================")
                        console.log('削除のclass名が間違えています');
                    }
                }

            // タイトル用のフォームがない場合
            }else if (await page.$('.book_body') && await page.$('input[type="submit"]')){
                console.log("============================")
                console.log("×タイトル用のフォームがありません。formやclass名を確認して下さい")
                process.exit(1);
            // 本の感想用のフォームがない場合
            }else if (await page.$('.book_title') && await page.$('input[type="submit"]')){
                console.log("============================")
                console.log("×本の感想文用のフォームがありません。formやclass名を確認して下さ")
                process.exit(1);
            // #########################################################
            // 送信ボタンがない場合
            }else if (await page.$('.book_title') && await page.$('.book_body')){
                console.log("============================")
                console.log("×フォームの送信ボタンがありません。submitやclass名を確認して下さい")
                process.exit(1);
            // #########################################################
            // その他
            }else{
                console.log("============================")
                console.log("×一覧ページが表示できません。クラス名やform、一覧表示ができるか確認して下さい")
                process.exit(1);
            }

        // #########################################################
        // 閉じる
        await page.close();
        await browser.close();
    } catch (error) {
          console.log("×テストの途中でエラーになりました。該当するテストの処理やclass名・スペルミスがないかもう一度確認してください。");
          console.log(error);
          process.exit(1) //サーバーの停止
        }
})();