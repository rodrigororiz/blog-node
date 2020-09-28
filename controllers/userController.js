const { read } = require('jimp');
const User = require('../models/User');
const crypto = require('crypto');
const mailHandler = require('../handlers/mailHandler');


exports.login = (req, res)=>{
    res.render('login')
}

exports.loginAction = (req, res)=>{
    const auth = User.authenticate();

    auth(req.body.email, req.body.password, (error, result)=> {
        if(!result) {
            req.flash('error', 'Seu email ou senha estão incorretos.');
            res.redirect('/users/login');
            return;
        }

        req.login(result, ()=>{});

        req.flash('success', 'Você foi logado com sucesso!!')
        res.redirect('/');
    });
}

exports.register = (req, res)=>{
    res.render('register') 
}

exports.registerAction = (req, res) => {
    const newUser = new User(req.body);
    User.register(newUser, req.body.password, (error)=>{
        if(error) {
            req.flash('error', 'Ocorreu um erro, tente mais tarde.')
            res.redirect('/users/register');
            return;
        }

        req.flash('success', 'Registro efetuado com sucesso. Faça o login.')
        res.redirect('/users/login');
    }); 
}

exports.logout = (req, res) => {
    req.logout();
    res.redirect('/');
}

exports.profile =  (req, res) => {
    res.render('profile');
}

exports.profileAction = async (req, res) => {

    try{
        const user = await User.findOneAndUpdate(
            {_id:req.user._id},
            {name:req.body.name, email:req.body.email},
            {new:true, runValidators:true}
        )
    } catch(e) {
        req.flash('error', 'Ocorreu algum erro' + e.message);
        res.redirect('/profile');
        return;
    }
    
    req.flash('success', 'Dados atualizados com sucesso!');
    res.redirect('/profile'); 
}

exports.forget = (req, res) => {
    res.render('forget');
}

exports.forgetAction = async (req, res) => {
    //Verficar se o usuario existe
    const user = await User.findOne({email:req.body.email}).exec();
    if(!user) {
        req.flash('error', 'Email não cadastrado.');
        res.redirect('/users/forget');
        return;
    }
    //Gerar um token (com data de expiração) e salvas no banco de dados
    user.resetPassworsToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000;//1 hora

    await user.save;

    //Gerar link (com token) para trocar a senha
    const resetLink = `http://${req.headers.host}/users/reset/${user.resetPassworsToken}`;

    
    //Enviar o link via email para o usuario
    const html = `Testando email com link:<br><a href="${resetLink}">Resetar sua Senha</a>`;
    const text = `Testando email com link: ${resetLink}`;

    mailHandler.send({
        to:user.email,
        subject:'Resetar sua senha',
        html,
        text
    });

    req.flash('success', 'Te enviamos um email com instruções.');
    res.redirect('/users/login');
    //Usuario vai acessar o link e trocar a senha
}

exports.forgetToken = async (req, res) => {
    const user = await User.findOne({
        resetPassworsToken:req.params.token,
        resetPasswordExpires:{$gt:Date.now()}
    }).exec();

    if(!user) {
        req.flash('error', 'Token expirado!');
        res.redirect('/users/forget');
        return;
    }

    res.render('forgetPassword');
}

exports.forgetTokenAction = async (req, res) => {
    const user = await User.findOne({
        resetPassworsToken:req.params.token,
        resetPasswordExpires:{$gt:Date.now()}
    }).exec();

    if(!user) {
        req.flash('error', 'Token expirado!');
        res.redirect('/users/forget');
        return;
    }

    //Confirmar que as senhas batem.
    if(req.body.password != req.body['password-confirm']) {
        req.flash('error', 'Senhas diferentes.')
        res.redirect('back')
        return;
    }
    //Procurar o usuario e trocar a senha dele.

    user.setPassword(req.body.password, async () => {
        await user.save();

        req.flash('success', 'Senha alterada com sucesso!');
        res.redirect('/'); 
    })
}